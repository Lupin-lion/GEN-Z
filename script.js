document.addEventListener("DOMContentLoaded", () => {
    alert("Welcome to GEN-Z! Let's connect and share.");

    const postFeed = document.querySelector(".post-feed");

    // Fetch posts from the backend
    async function fetchPosts() {
        try {
            const response = await fetch("http://localhost:3000/api/posts");
            const posts = await response.json();
            postFeed.innerHTML = ""; // Clear existing posts
            posts.forEach((post) => {
                const postElement = document.createElement("div");
                postElement.classList.add("post");
                postElement.innerHTML = `
                    <h2>${post.title}</h2>
                    <p>${post.content}</p>
                    <div class="reaction">
                        <button class="like-btn" data-id="${post._id}">👍 Like</button>
                        <span class="like-count">${post.likes}</span>
                        <button class="comment-btn" data-id="${post._id}">💬 Comments</button>
                    </div>
                    <div class="comment-section">
                        <input type="text" class="comment-input" placeholder="Write a comment...">
                        <button class="add-comment-btn" data-id="${post._id}">Add Comment</button>
                        <div class="comment-list">
                            ${post.comments
                                .map(
                                    (comment) => `
                                <div class="comment">
                                    <p>${comment.text}</p>
                                </div>
                            `
                                )
                                .join("")}
                        </div>
                    </div>
                `;
                postFeed.appendChild(postElement);
            });
        } catch (err) {
            console.error("Error fetching posts:", err);
        }
    }

    fetchPosts();

    // Add event listeners for like and comment buttons
    postFeed.addEventListener("click", (event) => {
        const target = event.target;
        const postId = target.dataset.id;

        if (target.classList.contains("like-btn")) {
            likePost(postId);
        } else if (target.classList.contains("add-comment-btn")) {
            const commentInput = target.previousElementSibling;
            const commentText = commentInput.value.trim();
            if (commentText) {
                addComment(postId, commentText);
                commentInput.value = ""; // Clear input
            }
        }
    });

    // Like a post
    async function likePost(postId) {
        try {
            const response = await fetch(
                `http://localhost:3000/api/posts/${postId}/like`,
                { method: "POST" }
            );
            if (response.ok) {
                fetchPosts(); // Refresh posts
            }
        } catch (err) {
            console.error("Error liking post:", err);
        }
    }

    // Add a comment to a post
    async function addComment(postId, text) {
        try {
            const response = await fetch(
                `http://localhost:3000/api/posts/${postId}/comments`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ text }),
                }
            );
            if (response.ok) {
                fetchPosts(); // Refresh posts
            }
        } catch (err) {
            console.error("Error adding comment:", err);
        }
    }
});

const navLinks = document.querySelector(".nav-links");

document.querySelector(".logo").addEventListener("click", () => {
    navLinks.classList.toggle("active");
});

async function submitForm(event) {
    event.preventDefault(); // Prevent form submission from reloading the page

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const message = document.getElementById("message").value;

    try {
        const response = await fetch("http://localhost:3000/api/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, email, message }),
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
        } else {
            alert(result.error || "An error occurred");
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("Failed to submit the form");
    }
}

<form onsubmit="submitForm(event)">
    <input type="text" id="name" placeholder="Name" required />
    <input type="email" id="email" placeholder="Email" required />
    <textarea id="message" placeholder="Message" required></textarea>
    <button type="submit">Submit</button>
</form>