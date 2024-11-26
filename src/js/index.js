import { DatabaseManager } from "./indexedDB.js";

// Singleton instance of DatabaseManager to interact with IndexedDB
const dbManager = DatabaseManager.getInstance();

const noteColorInput = document.querySelector("#noteColor");
const addButton = document.querySelector("#addButton");
const mainElement = document.querySelector("main");

// This counter is incremented when a new note is created and add 1 to the new that has been created
let counterID = 0;

// Just open the database
dbManager.open().then(() => {
  loadNotes();
});

// Fetch and render all notes from IndexedDB
function loadNotes() {
  dbManager.readAllData().then((notes) => {
    notes.forEach((noteData) => {
      createNote(noteData); // Render each note in the DOM
      const noteIdNumber = parseInt(noteData.id.split("-")[1]); // Extract numeric part of ID
      counterID = Math.max(counterID, noteIdNumber + 1); // Update counterID
    });
  });
}

// When the button is clicked, this event create a new note
addButton.addEventListener("click", () => {
  const noteData = {
    id: `note-${counterID}`,
    color: noteColorInput.value,
    content: "",
    x: 0,
    y: 0,
  };

  createNote(noteData);
  dbManager.createData(noteData);
  counterID++;
});

// Create a new note
function createNote(noteData) {
  const newNote = document.createElement("div");
  newNote.classList = "note";
  newNote.id = noteData.id;
  newNote.style.left = `${noteData.x}px`;
  newNote.style.top = `${noteData.y}px`;

  const noteHeader = document.createElement("div");
  noteHeader.classList = "noteHeader";
  noteHeader.innerHTML = `<button class="delete"><strong>x</strong></button>`;
  noteHeader.style.background = noteData.color;

  const noteContent = document.createElement("div");
  noteContent.classList = "noteContent";
  noteContent.innerHTML = `
    <textarea name="noteText" placeholder="Write Content...">${noteData.content}</textarea>
  `;

  newNote.appendChild(noteHeader);
  newNote.appendChild(noteContent);

  mainElement.appendChild(newNote);
}

// Delete notes
document.addEventListener("click", (event) => {
  if (event.target.classList.contains("delete")) {
    const note = event.target.closest(".note");
    const noteId = note.id;

    dbManager.deleteData(noteId).then(() => {
      note.remove();
    });
  }
});

// Event for save the note that has been edited
document.addEventListener("input", (event) => {
  if (event.target.tagName === "TEXTAREA") {
    const note = event.target.closest(".note");
    const noteId = note.id;
    const updatedContent = event.target.value;

    dbManager.updateData(noteId, { content: updatedContent }); // Save changes in IndexedDB
  }
});

// Variables to track note dragging
let cursor = { x: null, y: null }; /
let note = {
  dom: null,
  x: null,
  y: null,
};
let zIndexValue = 1; //

// Start to drag a note
document.addEventListener("mousedown", (event) => {
  if (event.target.classList.contains("noteHeader")) {
    cursor = { x: event.clientX, y: event.clientY };

    const current = event.target.closest(".note"); // Note selected
    note = {
      dom: current,
      x: current.getBoundingClientRect().left,
      y: current.getBoundingClientRect().top,
    };

    current.style.cursor = "grabbing";
    current.style.zIndex = zIndexValue++; //This is just to bring the clicked note to the front
  }
});

// Event to drag a note
document.addEventListener("mousemove", (event) => {
  if (note.dom === null) return; // Ignore if no note is being dragged

  const currentCursor = { x: event.clientX, y: event.clientY }; // Get current cursor position
  const distance = {
    x: currentCursor.x - cursor.x, // Calculate X displacement
    y: currentCursor.y - cursor.y, // Calculate Y displacement
  };

  // Update note position
  note.dom.style.left = `${note.x + distance.x}px`;
  note.dom.style.top = `${note.y + distance.y}px`;

  // This is to update the position in IndexedDB
  const noteId = note.dom.id;
  dbManager.updateData(noteId, {
    x: note.x + distance.x,
    y: note.y + distance.y,
  });
});

// Stop note drag
document.addEventListener("mouseup", () => {
  if (note.dom) {
    note.dom.style.cursor = "grab"; // Reset cursor style
    note.dom = null; // Clear the dragged note reference
  }
});
