import React, { useEffect, useState, useRef } from "react";

export default function AjaxLikeForm() {
  const [formData, setFormData] = useState({});
  const formLoaded = useRef(false); // mencegah render ulang

    const loadData = async () => {
      const res = await fetch("http://localhost:3001/api/getFormData");
      const json = await res.json();
      setFormData(json); // isi form
    };

  // Load data hanya sekali (seperti AJAX load)
  useEffect(() => {
    if (formLoaded.current) return; // cegah load ulang


    loadData();
    formLoaded.current = true;
  }, []);

  // Update field (mirip onchange jQuery)
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Simpan (AJAX submit)
  const saveData = async () => {
    const res = await fetch("http://localhost:3001/api/saveForm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const json = await res.json();
    alert("Saved: " + JSON.stringify(json));
  };

  return (
    <div style={{ padding: 20 }}>

      <h2>Ajax-Style Dynamic Form</h2>

      <label>
        Nama:
        <input
          value={formData.nama || ""}
          onChange={(e) => updateField("nama", e.target.value)}
        />
      </label>
      <br />

      <label>
        Email:
        <input
          value={formData.email || ""}
          onChange={(e) => updateField("email", e.target.value)}
        />
      </label>
      <br />

      <label>
        Alamat:
        <textarea
          value={formData.alamat || ""}
          onChange={(e) => updateField("alamat", e.target.value)}
        />
      </label>
      <br />

      <button onClick={saveData}>Simpan</button>
      <button onClick={loadData}>Refresh</button>

      <pre style={{ background: "#eee", padding: 10, marginTop: 20 }}>
        {JSON.stringify(formData, null, 2)}
      </pre>
    </div>
  );
}
