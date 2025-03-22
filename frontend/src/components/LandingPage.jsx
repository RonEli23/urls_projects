import React, { useState } from "react";
import "../styles/LandingPage.css"; // External CSS file
import axios from "../api/axios";
import Slider from "react-slick"; // Carousel library
import "slick-carousel/slick/slick.css"; 
import "slick-carousel/slick/slick-theme.css";

const FETCH_DATA = "/fetch-metadata"; // Adjust API endpoint

const LandingPage = () => {
  const [urls, setUrls] = useState("");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alertMessage, setAlertMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setAlertMessage("");

    const urlList = urls.split("\n").map(url => url.trim()).filter(url => url);

    if (urlList.length < 3) {
      setAlertMessage("Please enter at least 3 URLs.");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(FETCH_DATA, { urls: urlList }, {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      });

      setData(response.data);
    } catch (err) {
      setError("Failed to fetch metadata. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>URL Metadata Fetcher</h1>
      
      {/* Form to input URLs */}
      <form className="url-form" onSubmit={handleSubmit}>
        <textarea
          placeholder="Enter at least 3 URLs (one per line)..."
          value={urls}
          onChange={(e) => setUrls(e.target.value)}
          className="input-field"
        />
        {alertMessage && <p className="alert-message">{alertMessage}</p>}
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={loading || urls.split("\n").filter(url => url.trim()).length < 3}
        >
          {loading ? "Fetching..." : "Fetch Metadata"}
        </button>
      </form>

      {error && <p className="error-message">{error}</p>}

      {/* Display fetched metadata as slides */}
      {data.length > 0 && (
        <div className="slider-container">
          <Slider dots={true} infinite={true} speed={500} slidesToShow={1} slidesToScroll={1}>
            {data.map((item, index) => (
              <div key={index} className="slide">
                <h3>{item.url}</h3>

                {item.metadata ? (
                  <>
                    <p><strong>Title:</strong> {item.metadata.title}</p>
                    <p><strong>Description:</strong> {item.metadata.description}</p>
                    <img src={item.metadata.image} alt="Preview" className="preview-img" />
                  </>
                ) : (
                  <p className="error-message">{item.error}</p>
                )}
              </div>
            ))}
          </Slider>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
