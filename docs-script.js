/**
 * DRAFT DOCS - VANILLA JAVASCRIPT EDITOR
 * A Google Docs-like web editor with local storage
 */

// ===========================
// GLOBAL VARIABLES
// ===========================
const editor = document.getElementById('editor');
const docTitle = document.getElementById('doc-title');
const saveStatus = document.getElementById('save-status');
const saveBtn = document.getElementById('save-btn');
const fontSizeSelect = document.getElementById('font-size');
const formatBlockSelect = document.getElementById('format-block');

// Auto-save interval (5 seconds)
const AUTO_SAVE_INTERVAL = 5000;
let autoSaveTimer = null;
let hasUnsavedChanges = false;

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    loadDocument();
    initializeToolbar();
    initializeKeyboardShortcuts();
    initializeAutoSave();
    initializeEditor();
});

// ===========================
// DOCUMENT MANAGEMENT
// ===========================

/**
 * Load document from localStorage
 */
function loadDocument() {
    const savedContent = localStorage.getItem('draftDocs_content');
    const savedTitle = localStorage.getItem('draftDocs_title');
    
    if (savedContent) {
        editor.innerHTML = savedContent;
    } else {
        // Start with a completely blank canvas
        editor.innerHTML = '';
    }
    
    if (savedTitle) {
        docTitle.value = savedTitle;
        updatePageTitle(savedTitle);
    }
    
    // Mark as saved initially
    updateSaveStatus('saved');
}

/**
 * Save document to localStorage
 */
function saveDocument() {
    const content = editor.innerHTML;
    const title = docTitle.value;
    
    localStorage.setItem('draftDocs_content', content);
    localStorage.setItem('draftDocs_title', title);
    
    hasUnsavedChanges = false;
    updateSaveStatus('saved');
    
    console.log('Document saved successfully');
}

/**
 * Update save status indicator
 */
function updateSaveStatus(status) {
    const saveStatus = document.getElementById('save-status');
    const saveText = document.getElementById('save-text');
    
    // Remove all status classes
    saveStatus.classList.remove('saving', 'saved', 'unsaved');
    
    if (status === 'saving') {
        saveText.textContent = 'Saving...';
        saveStatus.classList.add('saving');
    } else if (status === 'saved') {
        saveText.textContent = 'Saved';
        saveStatus.classList.add('saved');
    } else if (status === 'unsaved') {
        saveText.textContent = 'Unsaved';
        saveStatus.classList.add('unsaved');
    }
}

/**
 * Update page title
 */
function updatePageTitle(title) {
    document.title = `${title} - Draft Docs`;
}

// ===========================
// AUTO-SAVE FUNCTIONALITY
// ===========================

/**
 * Initialize auto-save
 */
function initializeAutoSave() {
    // Set up auto-save interval
    autoSaveTimer = setInterval(() => {
        if (hasUnsavedChanges) {
            updateSaveStatus('saving');
            setTimeout(() => {
                saveDocument();
            }, 300); // Small delay for UX
        }
    }, AUTO_SAVE_INTERVAL);
}

/**
 * Mark document as having unsaved changes
 */
function markAsUnsaved() {
    hasUnsavedChanges = true;
    updateSaveStatus('unsaved');
}

// ===========================
// EDITOR INITIALIZATION
// ===========================

/**
 * Initialize editor event listeners
 */
function initializeEditor() {
    // Track changes in editor
    editor.addEventListener('input', markAsUnsaved);
    
    // Track changes in document title
    docTitle.addEventListener('input', function() {
        updatePageTitle(this.value);
        markAsUnsaved();
    });
    
    // Manual save button
    saveBtn.addEventListener('click', function() {
        updateSaveStatus('saving');
        setTimeout(() => {
            saveDocument();
        }, 300);
    });
    
    // Focus editor on load
    editor.focus();
}

// ===========================
// TOOLBAR FUNCTIONALITY
// ===========================

/**
 * Initialize toolbar buttons
 */
function initializeToolbar() {
    // Format buttons (bold, italic, underline, alignment, lists)
    const toolbarButtons = document.querySelectorAll('.toolbar-btn[data-command]');
    
    toolbarButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const command = this.getAttribute('data-command');
            executeCommand(command);
            editor.focus();
        });
    });
    
    // Font size selector
    fontSizeSelect.addEventListener('change', function() {
        executeCommand('fontSize', this.value);
        editor.focus();
    });
    
    // Format block selector (headings)
    formatBlockSelect.addEventListener('change', function() {
        executeCommand('formatBlock', this.value);
        editor.focus();
    });
    
    // Update active states on selection change
    document.addEventListener('selectionchange', updateToolbarStates);
}

/**
 * Execute formatting command
 */
function executeCommand(command, value = null) {
    document.execCommand(command, false, value);
    markAsUnsaved();
}

/**
 * Update toolbar button states based on current selection
 */
function updateToolbarStates() {
    const commands = ['bold', 'italic', 'underline'];
    
    commands.forEach(command => {
        const button = document.querySelector(`[data-command="${command}"]`);
        if (button) {
            if (document.queryCommandState(command)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    });
}

// ===========================
// KEYBOARD SHORTCUTS
// ===========================

/**
 * Initialize keyboard shortcuts
 */
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl/Cmd + B = Bold
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            executeCommand('bold');
        }
        
        // Ctrl/Cmd + I = Italic
        if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
            e.preventDefault();
            executeCommand('italic');
        }
        
        // Ctrl/Cmd + U = Underline
        if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
            e.preventDefault();
            executeCommand('underline');
        }
        
        // Ctrl/Cmd + S = Save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            updateSaveStatus('saving');
            setTimeout(() => {
                saveDocument();
            }, 300);
        }
    });
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Clear all content (for testing)
 */
function clearDocument() {
    if (confirm('Are you sure you want to clear the document? This cannot be undone.')) {
        editor.innerHTML = '<p>Start typing...</p>';
        docTitle.value = 'Untitled Document';
        updatePageTitle('Untitled Document');
        saveDocument();
    }
}

/**
 * Export document as HTML (for future enhancement)
 */
function exportAsHTML() {
    const content = editor.innerHTML;
    const title = docTitle.value;
    
    const fullHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            max-width: 816px;
            margin: 40px auto;
            padding: 96px;
            line-height: 1.6;
            color: #202124;
        }
        h1 { font-size: 28px; margin-bottom: 16px; }
        h2 { font-size: 22px; margin-top: 24px; margin-bottom: 12px; }
        h3 { font-size: 18px; margin-top: 20px; margin-bottom: 10px; }
        p { margin-bottom: 12px; }
        ul, ol { margin-left: 24px; margin-bottom: 12px; }
        li { margin-bottom: 6px; }
    </style>
</head>
<body>
    ${content}
</body>
</html>
    `;
    
    return fullHTML;
}

// ===========================
// CLEANUP
// ===========================

/**
 * Clean up on page unload
 */
window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges) {
        // Save before leaving
        saveDocument();
        
        // Show confirmation dialog
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
    }
});

/**
 * Stop auto-save timer on unload
 */
window.addEventListener('unload', function() {
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
});

// ===========================
// CONSOLE HELPERS (for developers)
// ===========================

console.log('%c Draft Docs Loaded Successfully ', 'background: #1a73e8; color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold;');
console.log('Available commands:');
console.log('  - saveDocument() - Manually save the document');
console.log('  - clearDocument() - Clear all content');
console.log('  - exportAsHTML() - Export document as HTML string');