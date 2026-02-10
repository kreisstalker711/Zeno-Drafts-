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
const publishBtn = document.getElementById('publish-btn');
const fontSizeSelect = document.getElementById('font-size');
const formatBlockSelect = document.getElementById('format-block');

// Auto-save interval (5 seconds)
const AUTO_SAVE_INTERVAL = 5000;
let autoSaveTimer = null;
let hasUnsavedChanges = false;

// Project and User specific
let currentUser = null;
let currentProjectId = null;

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', function() {
    currentUser = sessionStorage.getItem('zeno-user');
    if (!currentUser) {
        // This should be caught by the script in docs.html, but as a fallback.
        window.location.href = 'login.html';
        return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const urlProjectId = urlParams.get('id');
    // Only set currentProjectId if it's a valid-looking ID (not null/empty)
    if (urlProjectId) currentProjectId = urlProjectId;

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
    const allDocs = JSON.parse(localStorage.getItem('zenoDocs') || '{}');
    const userDocs = allDocs[currentUser] || [];
    
    let docToLoad = null;
    if (currentProjectId) {
        docToLoad = userDocs.find(doc => doc.id == currentProjectId);
    }

    if (docToLoad) {
        editor.innerHTML = docToLoad.content || '';
        docTitle.value = docToLoad.title || 'Untitled Document';
        updatePageTitle(docToLoad.title);
    } else {
        // New document or invalid ID
        currentProjectId = null; // Ensure we treat it as a new doc
        editor.innerHTML = '';
        docTitle.value = 'Untitled Document';
        updatePageTitle('Untitled Document');
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

    const allDocs = JSON.parse(localStorage.getItem('zenoDocs') || '{}');
    if (!allDocs[currentUser]) {
        allDocs[currentUser] = [];
    }
    
    let userDocs = allDocs[currentUser];
    let docIndex = -1;
    if (currentProjectId) {
        docIndex = userDocs.findIndex(doc => doc.id == currentProjectId);
    }

    if (docIndex > -1) {
        // Update existing document
        userDocs[docIndex].title = title;
        userDocs[docIndex].content = content;
        userDocs[docIndex].modifiedAt = new Date().toISOString();
    } else {
        // Create new document
        const newDoc = {
            id: String(Date.now()),
            title: title,
            content: content,
            author: currentUser,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            published: false
        };
        userDocs.push(newDoc);
        currentProjectId = newDoc.id;
        // Update URL without reloading page to reflect new project ID
        window.history.replaceState({}, '', `?id=${currentProjectId}`);
    }
    
    localStorage.setItem('zenoDocs', JSON.stringify(allDocs));

    hasUnsavedChanges = false;
    updateSaveStatus('saved');
    
    console.log('Document saved successfully');
}

/**
 * Update save status indicator
 */
function updateSaveStatus(status) {
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

/**
 * Publishes the current document.
 */
function publishDocument() {
    saveDocument(); // Save any pending changes first

    if (!currentProjectId) {
        // This case should be handled by saveDocument creating an ID, but as a safeguard.
        alert('Please save the document first before publishing.');
        return;
    }

    const allDocs = JSON.parse(localStorage.getItem('zenoDocs') || '{}');
    const userDocs = allDocs[currentUser] || [];
    const doc = userDocs.find(d => d.id == currentProjectId);

    doc.published = true;
    localStorage.setItem('zenoDocs', JSON.stringify(allDocs));
    alert(`'${doc.title}' has been published! You can see it on the homepage.`);
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

    // Publish button
    publishBtn.addEventListener('click', function() {
        publishDocument();
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
    if (confirm('This will start a new, blank document. Are you sure?')) {
        // Instead of clearing, we just redirect to the editor without a project ID
        window.location.href = 'docs.html';
        // The old logic is not compatible with the project-based system.
        // A "delete" function would be more appropriate.
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
        // Show confirmation dialog
        // Modern browsers may not show the custom message.
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        // We don't auto-save on exit anymore as it can be disruptive
        // and the user might want to discard changes.
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
console.log('  - publishDocument() - Publish the current document');
console.log('  - exportAsHTML() - Export document as HTML string');