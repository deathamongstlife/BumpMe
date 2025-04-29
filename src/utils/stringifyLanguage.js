module.exports = (language) => {
  let languageString = "";

  const languages = [
    { name: "English", value: "en" },
    { name: "German", value: "de" },
    { name: "French", value: "fr" },
    { name: "Spanish", value: "es" },
    { name: "Italian", value: "it" },
    { name: "Japanese", value: "ja" },
    { name: "Korean", value: "ko" },
    { name: "Portuguese", value: "pt" },
    { name: "Russian", value: "ru" },
    { name: "Chinese", value: "zh" },
    { name: "Arabic", value: "ar" },
    { name: "Bengali", value: "bn" },
    { name: "Dutch", value: "nl" },
    { name: "Finnish", value: "fi" },
    { name: "Greek", value: "el" },
    { name: "Hindi", value: "hi" },
    { name: "Indonesian", value: "id" },
    { name: "Malay", value: "ms" },
    { name: "Norwegian", value: "no" },
    { name: "Polish", value: "pl" },
    { name: "Swedish", value: "sv" },
    { name: "Thai", value: "th" },
    { name: "Turkish", value: "tr" },
    { name: "Vietnamese", value: "vi" },
    { name: "Welsh", value: "cy" },
  ];

  for (const lang of languages) {
    if (lang.value === language) {
      languageString = lang.name;
    }
  }

  return languageString;
};
