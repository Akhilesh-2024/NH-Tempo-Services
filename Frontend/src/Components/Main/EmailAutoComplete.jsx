import React, { useState, useEffect } from "react";
import AutoCompleteInput from "./AutoCompleteInput";

const EmailAutoComplete = ({ value, onChange }) => {
  const [emailSuggestions, setEmailSuggestions] = useState([]);

  const emailDomains = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "protonmail.com",
    "icloud.com",
    "zoho.com",
  ];

  useEffect(() => {
    const [localPart, domainPart] = value.split("@");

    if (!localPart || value.includes(" ")) {
      setEmailSuggestions([]);
      return;
    }

    if (!domainPart) {
      setEmailSuggestions(emailDomains.map((d) => ({ name: `${localPart}@${d}` })));
    } else {
      const filtered = emailDomains
        .filter((d) => d.startsWith(domainPart.toLowerCase()))
        .map((d) => ({ name: `${localPart}@${d}` }));
      setEmailSuggestions(filtered);
    }
  }, [value]);

  return (
    <AutoCompleteInput
      data={emailSuggestions}
      placeholder="Enter your email"
      value={value}
      onChangeValue={onChange}
      onSelect={onChange}
    />
  );
};

export default EmailAutoComplete;
