import { useState } from "react";
import { XCircle } from "lucide-react";

const EventForm = ({ setShowForm, coordinates, setEvents }) => {
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    tags: "",
    image: null,
    date: "",
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [imageUrl, setImageUrl] = useState(null); // Store the image URL after upload

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Validate required fields
    if (!newEvent.title.trim() || !newEvent.date) {
      setErrorMessage("Title and date are required.");
      return;
    }
  
    if (!newEvent.image) {
      setErrorMessage("Please select an image to upload.");
      return;
    }
  
    let uploadedImageUrl = "";
    try {
      // Prepare FormData for image upload
      const formData = new FormData();
      formData.append("file", newEvent.image);
  
      // Upload image
      const response = await fetch("http://127.0.0.1:8000/upload-image/", {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Image upload failed");
      }
  
      const data = await response.json();
      uploadedImageUrl = data.image_url; // Use variable instead of state update
    } catch (error) {
      setErrorMessage("Failed to upload image.");
      return; // Stop execution if upload fails
    }
  
    try {
      // Construct event data
      const eventData = {
        username: "test_user", // Replace with actual user session data
        title: newEvent.title,
        description: newEvent.description,
        imageurl: uploadedImageUrl, // Ensure the image URL is included
        tags: newEvent.tags,
        longitude: coordinates[0],
        latitude: coordinates[1],
        date: newEvent.date, // Date should already be in YYYY-MM-DD format
        isEvent: true,
      };

      console.log("Event data being sent:", JSON.stringify(eventData));
  
      // Submit event
      const eventResponse = await fetch("http://127.0.0.1:8000/add-event/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventData),
      });
  
      if (!eventResponse.ok) throw new Error("Event submission failed");
  
      // Reset form on success
      setNewEvent({ title: "", description: "", tags: "", image: null, date: "" });
      setImagePreview(null);
      setImageUrl(null);
      setErrorMessage("");
      setShowForm(false);
      setEvents((prevEvents) => [...prevEvents, eventData]); // Update UI with new event
    } catch (error) {
      setErrorMessage("Failed to submit the event.");
    }
  };
  

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validImageTypes = ["image/png", "image/jpeg", "image/webp"];
      if (!validImageTypes.includes(file.type)) {
        setErrorMessage("Please upload a .png, .jpg, or .webp file.");
        setImagePreview(null);
        setNewEvent((prev) => ({ ...prev, image: null }));
        return;
      } else {
        setErrorMessage("");
        setNewEvent((prev) => ({ ...prev, image: file }));
        setImagePreview(URL.createObjectURL(file));
      }
    }
  };

  return (
    <div className="p-4 border rounded-lg shadow-sm bg-white max-h-[90vh] overflow-auto">
      <div className="flex justify-between">
        <h2 className="font-bold text-lg">New Event</h2>
        <button onClick={() => setShowForm(false)}>
          <XCircle size={20} />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2">
        <input
          type="text"
          placeholder="Event Title"
          className="p-2 border rounded-lg"
          value={newEvent.title}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, title: e.target.value }))
          }
        />
        <textarea
          placeholder="Event Description"
          className="p-2 border rounded-lg h-40 min-h-10 max-h-60 overflow-auto"
          value={newEvent.description}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, description: e.target.value }))
          }
        />
        <textarea
          placeholder="Tags"
          className="p-2 border rounded-lg h-10 min-h-10 max-h-20 overflow-auto"
          value={newEvent.tags}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, tags: e.target.value }))
          }
        />
        <input
          type="date"
          className="p-2 border rounded-lg"
          value={newEvent.date}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, date: e.target.value }))
          }
        />

        <input
          type="file"
          accept=".png,.jpg,.jpeg,.webp"
          onChange={handleImageChange}
          className="p-2 border rounded-lg"
        />
        {errorMessage && (
          <p className="text-red-500 text-sm mt-1">{errorMessage}</p>
        )}
        {imagePreview && (
          <img
            src={imagePreview}
            alt="Preview"
            className="w-full h-32 object-cover mt-2 rounded-lg"
          />
        )}

        <p className="text-gray-500 text-sm">
          Please upload an image in .png, .jpg, or .webp format.
        </p>

        <div className="ml-1 mt-2 text-gray-500 font-semibold">
          Coordinates: [{coordinates[0].toFixed(3)}, {coordinates[1].toFixed(3)}
          ]
        </div>

        <button
          type="submit"
          className="px-4 py-2 border rounded-lg bg-blue-500 text-white font-semibold"
        >
          Add Event
        </button>
      </form>
    </div>
  );
};

export default EventForm;
