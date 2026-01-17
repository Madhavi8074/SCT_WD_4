/* ================= STORAGE ================= */
class StorageService {
  static load() {
    return JSON.parse(localStorage.getItem("todos")) || [];
  }

  static save(todos) {
    localStorage.setItem("todos", JSON.stringify(todos));
  }
}

/* ================= MODEL ================= */
class TodoModel {
  constructor() {
    this.todos = StorageService.load();
  }

  add(title, deadline) {
    this.todos.push({
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
      completedAt: null,
      deadline: new Date(deadline).getTime()
    });
    this.commit();
  }

  toggle(id) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;

    todo.completed = !todo.completed;
    todo.completedAt = todo.completed ? Date.now() : null;
    this.commit();
  }

  delete(id) {
    this.todos = this.todos.filter(t => t.id !== id);
    this.commit();
  }

  getFiltered(filter) {
    if (filter === "active") return this.todos.filter(t => !t.completed);
    if (filter === "completed") return this.todos.filter(t => t.completed);
    return this.todos;
  }

  commit() {
    StorageService.save(this.todos);
  }
}

/* ================= VIEW ================= */
class TodoView {
  constructor() {
    this.list = document.getElementById("todo-list");
  }

  render(todos) {
    this.list.innerHTML = "";

    todos.forEach(todo => {
      const li = document.createElement("li");
      li.dataset.id = todo.id;

      const isOverdue =
        !todo.completed && Date.now() > todo.deadline;

      if (todo.completed) li.classList.add("completed");
      if (isOverdue) li.classList.add("overdue");

      const statusText = todo.completed
        ? `⏱ Completed in ${formatDuration(todo.completedAt - todo.createdAt)}`
        : isOverdue
          ? `⛔ Overdue (Deadline missed)`
          : `📅 Deadline: ${formatTime(todo.deadline)}`;

      li.innerHTML = `
        <div>
          <strong>${todo.title}</strong><br>
          <small>${statusText}</small>
        </div>
        <button data-action="delete">✕</button>
      `;

      this.list.appendChild(li);
    });
  }
}

/* ================= UTILS ================= */
function formatTime(ts) {
  return new Date(ts).toLocaleString();
}

function formatDuration(ms) {
  const sec = Math.floor(ms / 1000);
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

/* ================= CONTROLLER ================= */
class TodoController {
  constructor(model, view) {
    this.model = model;
    this.view = view;
    this.filter = "all";

    this.update();

    document.getElementById("todo-form").addEventListener("submit", e => {
      e.preventDefault();

      const title = document.getElementById("todo-input").value.trim();
      const deadline = document.getElementById("deadline-input").value;

      if (!title || !deadline) return;

      this.model.add(title, deadline);
      e.target.reset();
      this.update();
    });

    document.querySelector(".filters").addEventListener("click", e => {
      if (!e.target.dataset.filter) return;

      document.querySelectorAll(".filters button")
        .forEach(b => b.classList.remove("active"));

      e.target.classList.add("active");
      this.filter = e.target.dataset.filter;
      this.update();
    });

    this.view.list.addEventListener("click", e => {
      const li = e.target.closest("li");
      if (!li) return;

      const id = li.dataset.id;

      if (e.target.dataset.action === "delete") {
        this.model.delete(id);
      } else {
        this.model.toggle(id);
      }

      this.update();
    });
  }

  update() {
    this.view.render(this.model.getFiltered(this.filter));
  }
}

/* ================= INIT ================= */
new TodoController(
  new TodoModel(),
  new TodoView()
);
