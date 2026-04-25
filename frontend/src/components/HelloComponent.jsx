import { useEffect, useState } from "react";
import "../styles/components/HelloComponent.css";

function HelloComponent() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/hello-component")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error("Error fetching hello component:", err));
  }, []);

  return (
    <div className="hello-component">
      <p className="hello-component__text">{message}</p>
    </div>
  );
}

export default HelloComponent;
