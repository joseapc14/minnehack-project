"use client";
import { useState } from "react";
import { XCircle } from "lucide-react";

const EventForm = ({ setShowForm, coordinates, setEvents }) => {
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    image: null,
    date: "", 
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !newEvent.title.trim() ||
      !newEvent.description.trim() ||
      !newEvent.date
    ) {
      return; 
    }

    setEvents((prevEvents) => [
      ...prevEvents,
      { ...newEvent, coordinates: [...coordinates], isEvent: true },
    ]);

    // Reset form and state
    setNewEvent({
      title: "",
      description: "",
      image: null,
      date: "",
    });
    setImagePreview(null);
    setErrorMessage(""); 
    setShowForm(false);
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
          className="p-2 border rounded-lg h-40 min-h-10 max-h-80 overflow-auto" 
          value={newEvent.description}
          onChange={(e) =>
            setNewEvent((prev) => ({ ...prev, description: e.target.value }))
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
          Coordinates: [{coordinates[0].toFixed(3)}, {coordinates[1].toFixed(3)}]
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
