document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(text, type) {
    messageDiv.textContent = text;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");

    setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  }

  function buildParticipantsMarkup(activityName, participants) {
    if (!participants.length) {
      return "<p class=\"participants-empty\">No participants yet.</p>";
    }

    const sortedParticipants = [...participants].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" })
    );
    const encodedActivityName = encodeURIComponent(activityName);
    const listItems = sortedParticipants
      .map(
        (participant) => `
          <li class="participant-item">
            <span>${participant}</span>
            <button
              type="button"
              class="participant-delete"
              data-activity="${encodedActivityName}"
              data-email="${encodeURIComponent(participant)}"
              aria-label="Remove ${participant} from ${activityName}"
              title="Unregister participant"
            >🗑</button>
          </li>
        `
      )
      .join("");
    return `<ul class=\"participants-list\">${listItems}</ul>`;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsMarkup = buildParticipantsMarkup(name, details.participants);

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <details class="participants-details">
            <summary><strong>Participants (${details.participants.length})</strong></summary>
            ${participantsMarkup}
          </details>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        await fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error("Error signing up:", error);
    }
  });

  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".participant-delete");
    if (!deleteButton) {
      return;
    }

    const activity = decodeURIComponent(deleteButton.dataset.activity || "");
    const email = decodeURIComponent(deleteButton.dataset.email || "");

    if (!activity || !email) {
      showMessage("Could not determine participant to unregister.", "error");
      return;
    }

    deleteButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        await fetchActivities();
      } else {
        showMessage(result.detail || "Failed to unregister participant.", "error");
      }
    } catch (error) {
      showMessage("Failed to unregister participant. Please try again.", "error");
      console.error("Error unregistering participant:", error);
    } finally {
      deleteButton.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
