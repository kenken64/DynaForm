import { Request, Response } from 'express';

// Store active SSE connections
const sseConnections = new Map<string, Response[]>();

export class SSEService {
  /**
   * Add a new SSE connection for a specific thread ID
   */
  static addConnection(threadId: string, res: Response): void {
    if (!sseConnections.has(threadId)) {
      sseConnections.set(threadId, []);
    }
    
    const connections = sseConnections.get(threadId)!;
    connections.push(res);
    
    console.log(`SSE: Added connection for thread ${threadId}. Total connections: ${connections.length}`);
    
    // Clean up when connection closes
    res.on('close', () => {
      this.removeConnection(threadId, res);
    });
  }

  /**
   * Remove an SSE connection
   */
  static removeConnection(threadId: string, res: Response): void {
    const connections = sseConnections.get(threadId);
    if (connections) {
      const index = connections.indexOf(res);
      if (index > -1) {
        connections.splice(index, 1);
        console.log(`SSE: Removed connection for thread ${threadId}. Remaining: ${connections.length}`);
        
        // Clean up empty arrays
        if (connections.length === 0) {
          sseConnections.delete(threadId);
        }
      }
    }
  }

  /**
   * Send event to all connections for a specific thread ID
   */
  static sendToThread(threadId: string, event: string, data: any): void {
    const connections = sseConnections.get(threadId);
    if (!connections || connections.length === 0) {
      console.log(`SSE: No connections found for thread ${threadId}`);
      return;
    }

    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    
    connections.forEach((res, index) => {
      try {
        res.write(message);
        console.log(`SSE: Sent ${event} to connection ${index + 1}/${connections.length} for thread ${threadId}`);
      } catch (error) {
        console.error(`SSE: Failed to send to connection ${index + 1}:`, error);
        this.removeConnection(threadId, res);
      }
    });
  }

  /**
   * Send event to all active connections
   */
  static broadcast(event: string, data: any): void {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    let totalSent = 0;
    
    sseConnections.forEach((connections, threadId) => {
      connections.forEach((res, index) => {
        try {
          res.write(message);
          totalSent++;
        } catch (error) {
          console.error(`SSE: Failed to broadcast to thread ${threadId}, connection ${index + 1}:`, error);
          this.removeConnection(threadId, res);
        }
      });
    });
    
    console.log(`SSE: Broadcasted ${event} to ${totalSent} connections`);
  }

  /**
   * Get connection count for a thread
   */
  static getConnectionCount(threadId: string): number {
    const connections = sseConnections.get(threadId);
    return connections ? connections.length : 0;
  }

  /**
   * Get total connection count
   */
  static getTotalConnections(): number {
    let total = 0;
    sseConnections.forEach(connections => {
      total += connections.length;
    });
    return total;
  }
}
