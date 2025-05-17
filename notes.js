// Notes management script for KeviTest
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Notes Manager
    const NotesManager = {
        init: function() {
            this.loadNotes();
            this.setupEditor();
            this.currentNoteId = null;
            this.renderNotesCount();
        },

        notes: [],

        loadNotes: function() {
            const storedNotes = localStorage.getItem('kevitest_notes');
            this.notes = storedNotes ? JSON.parse(storedNotes) : [];
            this.renderNotesList();
        },

        saveNotes: function() {
            localStorage.setItem('kevitest_notes', JSON.stringify(this.notes));
            this.renderNotesList();
            this.renderNotesCount();
        },

        setupEditor: function() {
            // Initialize Quill rich text editor
            this.quill = new Quill('#editor-container', {
                modules: {
                    toolbar: [
                        [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'script': 'sub'}, { 'script': 'super' }],
                        [{ 'indent': '-1'}, { 'indent': '+1' }],
                        [{ 'align': [] }],
                        ['link', 'image', 'code-block'],
                        ['clean']
                    ]
                },
                placeholder: 'Start writing here...',
                theme: 'snow'
            });

            // Disable editor initially
            this.disableEditor();
        },

        enableEditor: function() {
            this.quill.enable();
            document.getElementById('note-title').disabled = false;
            document.getElementById('save-note-btn').disabled = false;
            document.getElementById('delete-note-btn').disabled = false;
        },

        disableEditor: function() {
            this.quill.enable(false);
            document.getElementById('note-title').disabled = true;
            document.getElementById('save-note-btn').disabled = true;
            document.getElementById('delete-note-btn').disabled = true;
            
            // Clear editor content
            this.quill.setContents([]);
            document.getElementById('note-title').value = '';
            this.currentNoteId = null;
        },

        createNewNote: function() {
            const newNote = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                title: 'Untitled Note',
                content: '',
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            };

            this.notes.unshift(newNote);
            this.saveNotes();
            this.loadNote(newNote.id);
        },

        loadNote: function(noteId) {
            const note = this.notes.find(n => n.id === noteId);
            if (!note) return;

            this.currentNoteId = noteId;
            document.getElementById('note-title').value = note.title;
            
            // Load content into editor
            try {
                const content = note.content ? JSON.parse(note.content) : [];
                this.quill.setContents(content);
            } catch (e) {
                console.error('Error parsing note content:', e);
                this.quill.setText(note.content || '');
            }

            this.enableEditor();
            this.highlightActiveNote(noteId);
        },

        saveCurrentNote: function() {
            if (!this.currentNoteId) return false;

            const index = this.notes.findIndex(n => n.id === this.currentNoteId);
            if (index === -1) return false;

            // Update note data
            this.notes[index].title = document.getElementById('note-title').value || 'Untitled Note';
            this.notes[index].content = JSON.stringify(this.quill.getContents());
            this.notes[index].updated = new Date().toISOString();

            this.saveNotes();
            return true;
        },

        deleteNote: function(noteId) {
            if (!noteId) return;

            if (confirm('Are you sure you want to delete this note?')) {
                this.notes = this.notes.filter(n => n.id !== noteId);
                this.saveNotes();

                if (this.currentNoteId === noteId) {
                    this.disableEditor();
                    // Load the first note if available
                    if (this.notes.length > 0) {
                        this.loadNote(this.notes[0].id);
                    }
                }
            }
        },

        renderNotesList: function() {
            const notesListEl = document.getElementById('notes-list');
            notesListEl.innerHTML = '';

            if (this.notes.length === 0) {
                notesListEl.innerHTML = '<div class="empty-message">No notes yet</div>';
                return;
            }

            // Sort notes by updated date (newest first)
            const sortedNotes = [...this.notes].sort((a, b) => 
                new Date(b.updated) - new Date(a.updated)
            );

            sortedNotes.forEach(note => {
                const noteEl = document.createElement('div');
                noteEl.classList.add('note-item');
                noteEl.dataset.id = note.id;
                
                if (this.currentNoteId === note.id) {
                    noteEl.classList.add('active');
                }

                const titleEl = document.createElement('div');
                titleEl.classList.add('note-item-title');
                titleEl.textContent = note.title;

                const dateEl = document.createElement('div');
                dateEl.classList.add('note-item-date');
                const updatedDate = new Date(note.updated);
                dateEl.textContent = updatedDate.toLocaleDateString();

                noteEl.appendChild(titleEl);
                noteEl.appendChild(dateEl);

                // Add event listener to load note
                noteEl.addEventListener('click', () => this.loadNote(note.id));

                notesListEl.appendChild(noteEl);
            });
        },

        renderNotesCount: function() {
            document.getElementById('notes-count').textContent = 
                this.notes.length + (this.notes.length === 1 ? ' note' : ' notes');
        },

        highlightActiveNote: function(noteId) {
            document.querySelectorAll('.note-item').forEach(item => {
                if (item.dataset.id === noteId) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        },

        searchNotes: function(query) {
            query = query.toLowerCase();
            
            const notesListEl = document.getElementById('notes-list');
            notesListEl.innerHTML = '';

            const filteredNotes = this.notes.filter(note => 
                note.title.toLowerCase().includes(query) || 
                (typeof note.content === 'string' && note.content.toLowerCase().includes(query))
            );

            if (filteredNotes.length === 0) {
                notesListEl.innerHTML = '<div class="empty-message">No matching notes</div>';
                return;
            }

            filteredNotes.forEach(note => {
                const noteEl = document.createElement('div');
                noteEl.classList.add('note-item');
                noteEl.dataset.id = note.id;
                
                if (this.currentNoteId === note.id) {
                    noteEl.classList.add('active');
                }

                const titleEl = document.createElement('div');
                titleEl.classList.add('note-item-title');
                titleEl.textContent = note.title;

                const dateEl = document.createElement('div');
                dateEl.classList.add('note-item-date');
                dateEl.textContent = new Date(note.updated).toLocaleDateString();

                noteEl.appendChild(titleEl);
                noteEl.appendChild(dateEl);

                noteEl.addEventListener('click', () => this.loadNote(note.id));
                notesListEl.appendChild(noteEl);
            });
        }
    };

    // UI event handlers for notes
    function setupNotesEventListeners() {
        // New note button
        document.getElementById('new-note-btn').addEventListener('click', () => {
            NotesManager.createNewNote();
        });

        // Save note button
        document.getElementById('save-note-btn').addEventListener('click', () => {
            if (NotesManager.saveCurrentNote()) {
                showNotification('Note saved successfully!');
            }
        });

        // Delete note button
        document.getElementById('delete-note-btn').addEventListener('click', () => {
            NotesManager.deleteNote(NotesManager.currentNoteId);
        });

        // Auto-save on title change
        document.getElementById('note-title').addEventListener('blur', () => {
            NotesManager.saveCurrentNote();
        });

        // Search notes
        document.getElementById('notes-search-btn').addEventListener('click', () => {
            const query = document.getElementById('notes-search-input').value.trim();
            if (query) {
                NotesManager.searchNotes(query);
            } else {
                NotesManager.renderNotesList();
            }
        });

        document.getElementById('notes-search-input').addEventListener('keyup', function(e) {
            if (e.key === 'Enter') {
                const query = this.value.trim();
                if (query) {
                    NotesManager.searchNotes(query);
                } else {
                    NotesManager.renderNotesList();
                }
            }
        });

        // Auto-save every 30 seconds if there's an active note
        setInterval(() => {
            if (NotesManager.currentNoteId) {
                NotesManager.saveCurrentNote();
            }
        }, 30000);
    }

    // Helper function to show a notification
    function showNotification(message, duration = 2000) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.right = '20px';
            notification.style.padding = '10px 20px';
            notification.style.backgroundColor = 'var(--primary-color)';
            notification.style.color = 'white';
            notification.style.borderRadius = 'var(--border-radius)';
            notification.style.boxShadow = 'var(--box-shadow)';
            notification.style.zIndex = '9999';
            notification.style.opacity = '0';
            notification.style.transition = 'opacity 0.3s ease';
            document.body.appendChild(notification);
        }

        // Set message and show notification
        notification.textContent = message;
        notification.style.opacity = '1';

        // Hide notification after duration
        setTimeout(() => {
            notification.style.opacity = '0';
        }, duration);
    }

    // Initialize notes functionality
    setupNotesEventListeners();
    NotesManager.init();
});
