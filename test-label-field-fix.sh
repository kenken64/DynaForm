#!/bin/bash

# Test script for label field fix verification
echo "🔍 Testing Label Field Implementation"
echo "======================================"

echo ""
echo "1. Checking Form Editor Template for Label Handling..."
if grep -q "ngSwitchCase=\"'label'\"" "/Users/kennethphang/Projects/doc2formjson/dynaform/src/app/form-editor/form-editor.component.html"; then
    echo "✅ Form editor has label switch case"
else
    echo "❌ Form editor missing label switch case"
fi

echo ""
echo "2. Checking for Label Element Styling..."
if grep -q "label-element" "/Users/kennethphang/Projects/doc2formjson/dynaform/src/app/form-editor/form-editor.component.html"; then
    echo "✅ Form editor has label element styling"
else
    echo "❌ Form editor missing label element styling"
fi

echo ""
echo "3. Checking TypeScript isLabelField Method..."
if grep -q "isLabelField" "/Users/kennethphang/Projects/doc2formjson/dynaform/src/app/form-editor/form-editor.component.ts"; then
    echo "✅ Form editor has isLabelField method"
else
    echo "❌ Form editor missing isLabelField method"
fi

echo ""
echo "4. Checking Type Mapping for Label..."
if grep -q "'label': 'label'" "/Users/kennethphang/Projects/doc2formjson/dynaform/src/app/form-editor/form-editor.component.ts"; then
    echo "✅ Type mapping includes label -> label"
else
    echo "❌ Type mapping missing label -> label"
fi

echo ""
echo "5. Checking CSS for Label Styling..."
if grep -q "label-heading" "/Users/kennethphang/Projects/doc2formjson/dynaform/src/app/form-editor/form-editor.component.css"; then
    echo "✅ CSS has label-heading styles"
else
    echo "❌ CSS missing label-heading styles"
fi

echo ""
echo "6. Checking Other Viewer Components..."

# Form Viewer
if grep -q "isLabelField" "/Users/kennethphang/Projects/doc2formjson/dynaform/src/app/form-viewer/form-viewer.component.html"; then
    echo "✅ Form viewer handles label fields"
else
    echo "❌ Form viewer missing label field handling"
fi

# Public Form
if grep -q "field.type === 'label'" "/Users/kennethphang/Projects/doc2formjson/dynaform/src/app/public-form/public-form.component.html"; then
    echo "✅ Public form handles label fields"
else
    echo "❌ Public form missing label field handling"
fi

# Dashboard
if grep -q "field.type === 'label'" "/Users/kennethphang/Projects/doc2formjson/dynaform/src/app/dashboard/dashboard.component.html"; then
    echo "✅ Dashboard handles label fields"
else
    echo "❌ Dashboard missing label field handling"
fi

echo ""
echo "7. Checking for Default Case in Form Editor..."
if grep -q "ngSwitchDefault" "/Users/kennethphang/Projects/doc2formjson/dynaform/src/app/form-editor/form-editor.component.html"; then
    echo "✅ Form editor has default case for unknown types"
else
    echo "⚠️  Form editor missing default case (may cause issues with unknown types)"
fi

echo ""
echo "========================================="
echo "🎯 SUMMARY"
echo "========================================="
echo ""
echo "The label field fix includes:"
echo "• Enhanced form editor template with proper label case"
echo "• Improved CSS styling with blue border and background"
echo "• isLabelField() helper method for debugging"
echo "• Proper type mapping from 'label' -> 'label'"
echo "• Default case for debugging unknown field types"
echo "• All viewer components already handle labels correctly"
echo ""
echo "🚀 Expected Result:"
echo "Label fields should now render as styled headings with:"
echo "- Blue left border and light background"
echo "- Helper text indicating it's read-only"
echo "- No input field appearance"
echo "- Proper h3 heading display"
echo ""
echo "If the issue persists, it may be due to:"
echo "1. Browser cache - try hard refresh (Cmd+Shift+R)"
echo "2. Angular build cache - restart dev server"
echo "3. Existing form data has incorrect field type"
echo ""
echo "To debug further, check browser console for:"
echo "- Element type logs during form loading"
echo "- Any unknown element type warnings (red dashed border)"
