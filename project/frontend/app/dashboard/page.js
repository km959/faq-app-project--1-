async function handleFaqSend(e) {
  e.preventDefault();

  const question = draft.trim();

  if (!question || faqSaving) {
    return;
  }

  setMessages(function (prev) {
    return prev.concat([
      {
        from: "user",
        text: question,
      },
    ]);
  });

  setDraft("");
  setFaqSaving(true);
  setError("");

  try {
    const data = await api.askFaq(question,messages);

    if (data.source === "ai" && data.answer) {
      setMessages(function (prev) {
        return prev.concat([
          {
            from: "bot",
            text: data.answer.replace(/\*\*/g, ""),
          },
        ]);
      });

      return;
    }

    if (data.answer) {
      setMessages(function (prev) {
        return prev.concat([
          {
            from: "bot",
            text: data.answer.replace(/\*\*/g, ""),
          },
        ]);
      });

      return;
    }

    setMessages(function (prev) {
      return prev.concat([
        {
          from: "bot",
          text: "I couldn't find a relevant answer. Would you like to raise a support ticket?",
        },
      ]);
    });

    setTicketPreference("unsure");
    setFaqDone(true);
  } catch (err) {
    setError(err.message);

    setMessages(function (prev) {
      return prev.concat([
        {
          from: "bot",
          text: "Sorry, I couldn't process your question right now. Please try again.",
        },
      ]);
    });
  } finally {
    setFaqSaving(false);
  }
}