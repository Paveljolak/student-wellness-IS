import { useEffect, useState } from "react";
import HelloComponent from "../components/HelloComponent";
import "../styles/pages/HelloPage.css";

function HelloPage() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("http://localhost:3000/hello")
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((err) => console.error("Error fetching hello:", err));
  }, []);

  return (
    <div className="hello-page">
      <h1 className="hello-page__title">{message}</h1>
      <HelloComponent />
    </div>
  );
}

export default HelloPage;
