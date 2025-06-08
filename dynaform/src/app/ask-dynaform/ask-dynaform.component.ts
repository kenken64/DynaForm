import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../auth/auth.service';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatResponse {
  success: boolean;
  data: {
    message: string;
    timestamp: string;
  };
}

@Component({
  selector: 'app-ask-dynaform',
  templateUrl: './ask-dynaform.component.html',
  styleUrls: ['./ask-dynaform.component.css']
})
export class AskDynaformComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  chatForm: FormGroup;
  messages: ChatMessage[] = [];
  isLoading = false;
  error = '';
  
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(
    private http: HttpClient,
    private fb: FormBuilder,
    private authService: AuthService
  ) {
    this.chatForm = this.fb.group({
      message: ['', [Validators.required, Validators.minLength(1)]]
    });
  }

  ngOnInit(): void {
    // Add welcome message
    this.addMessage({
      id: this.generateMessageId(),
      content: 'Hello! I\'m your DynaForm AI assistant. I can help you with form creation, data extraction, and answer questions about using DynaForm. What would you like to know?',
      role: 'assistant',
      timestamp: new Date()
    });
  }

  trackByMessageId(index: number, message: ChatMessage): string {
    return message.id;
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSubmit(): void {
    if (this.chatForm.invalid || this.hasStreamingMessage()) {
      return;
    }

    const userMessage = this.chatForm.get('message')?.value.trim();
    if (!userMessage) {
      return;
    }

    // Add user message
    this.addMessage({
      id: this.generateMessageId(),
      content: userMessage,
      role: 'user',
      timestamp: new Date()
    });

    // Clear the input
    this.chatForm.reset();

    // Send message to backend
    this.sendMessage(userMessage);
  }

  private sendMessage(message: string): void {
    this.error = '';
    this.setFormEnabled(false); // Disable form during processing

    // Add streaming assistant message
    const assistantMessageId = this.generateMessageId();
    this.addMessage({
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true
    });

    // Get auth token
    const headers = this.authService.getAuthHeaders();

    this.http.post<ChatResponse>('/api/chat/ask-dynaform', 
      { message }, 
      { headers: headers }
    ).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.updateMessage(assistantMessageId, response.data.message, false);
        this.setFormEnabled(true); // Re-enable form when done
      },
      error: (error) => {
        console.error('Chat error:', error);
        this.updateMessage(assistantMessageId, 'Sorry, I encountered an error while processing your request. Please try again.', false);
        this.error = 'Failed to send message. Please try again.';
        this.setFormEnabled(true); // Re-enable form on error
      }
    });
  }

  private addMessage(message: ChatMessage): void {
    this.messages.push(message);
    this.shouldScrollToBottom = true;
  }

  private updateMessage(id: string, content: string, isStreaming: boolean): void {
    const messageIndex = this.messages.findIndex(m => m.id === id);
    if (messageIndex !== -1) {
      this.messages[messageIndex].content = this.cleanResponseContent(content);
      this.messages[messageIndex].isStreaming = isStreaming;
      this.shouldScrollToBottom = true;
    }
  }

  private cleanResponseContent(content: string): string {
    // Remove <think> tags and their content
    let cleanedContent = content.replace(/<think>[\s\S]*?<\/think>/gi, '');
    
    // Remove any remaining <think> or </think> tags that might be unclosed
    cleanedContent = cleanedContent.replace(/<\/?think>/gi, '');
    
    // Clean up extra whitespace that might be left after removing tags
    cleanedContent = cleanedContent.replace(/\n\s*\n\s*\n/g, '\n\n');
    cleanedContent = cleanedContent.trim();
    
    return cleanedContent;
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop = this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  private generateMessageId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  hasStreamingMessage(): boolean {
    return this.messages.some(message => message.isStreaming);
  }

  private setFormEnabled(enabled: boolean): void {
    if (enabled) {
      this.chatForm.get('message')?.enable();
    } else {
      this.chatForm.get('message')?.disable();
    }
  }

  get isSendButtonDisabled(): boolean {
    return this.chatForm.invalid || this.hasStreamingMessage();
  }

  onKeyDown(event: KeyboardEvent): void {
    // Send message on Enter, but allow Shift+Enter for new lines
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSubmit();
    }
  }

  clearChat(): void {
    this.messages = [];
    this.error = '';
    this.setFormEnabled(true); // Ensure form is enabled when chat is cleared
    // Add welcome message back
    this.addMessage({
      id: this.generateMessageId(),
      content: 'Chat cleared! How can I help you with DynaForm today?',
      role: 'assistant',
      timestamp: new Date()
    });
  }

  isMessageFromToday(message: ChatMessage): boolean {
    const today = new Date();
    const messageDate = new Date(message.timestamp);
    return today.toDateString() === messageDate.toDateString();
  }

  formatTime(timestamp: Date): string {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }
}
