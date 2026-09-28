"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";

const EMAIL_PATTERN =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const PHONE_PATTERN = /^\d{10}$/;

const NAME_PATTERN =
  /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const QUESTION_PATTERN =
  /^(what|why|how|when|where|who|which|can|could|would|should|is|are|do|does|did|will|tell me|explain|please tell me)\b/i;

export default function LoginChatbot() {
  const [widgetOpen, setWidgetOpen] = useState(false);
  const [chatStage, setChatStage] = useState("name");
  const [items, setItems] = useState([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [ticketStage, setTicketStage] =
    useState("none");

  const [ticketField, setTicketField] =
    useState("all");

  const [ticketQuestion, setTicketQuestion] =
    useState("");

  const [ticketName, setTicketName] =
    useState("");

  const [ticketEmail, setTicketEmail] =
    useState("");

  const [ticketPhone, setTicketPhone] =
    useState("");

  const bottomRef = useRef(null);

  useEffect(function () {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [items]);

  function buildHistory() {
    return items
      .filter(function (item) {
        return (
          item.kind === "user" ||
          item.kind === "bot"
        );
      })
      .slice(-10)
      .map(function (item) {
        return {
          role:
            item.kind === "user"
              ? "user"
              : "assistant",
          text: item.text,
        };
      });
  }

  function typeOutMessage(fullText, onDone) {
    const text = String(fullText || "").replace(
      /\*\*/g,
      ""
    );

    setItems(function (prev) {
      return prev.concat([
        {
          kind: "bot",
          text: "",
        },
      ]);
    });

    let index = 0;
    const speed = 15;

    const interval = setInterval(function () {
      index += 3;

      setItems(function (prev) {
        const updated = prev.slice();
        const lastIndex =
          updated.length - 1;

        if (lastIndex < 0) {
          return prev;
        }

        updated[lastIndex] = {
          kind: "bot",
          text: text.slice(0, index),
        };

        return updated;
      });

      if (index >= text.length) {
        clearInterval(interval);

        if (onDone) {
          onDone();
        }
      }
    }, speed);
  }

  async function freshGreeting() {
    setItems([]);
    setError("");
    setDraft("");
    setChatStage("name");

    setTicketStage("none");
    setTicketField("all");
    setTicketQuestion("");
    setTicketName("");
    setTicketEmail("");
    setTicketPhone("");

    setSending(true);

    try {
      const response =
        await api.publicChat(
          "__login_start__",
          []
        );

      setSending(false);

      if (
        response &&
        response.answer
      ) {
        typeOutMessage(
          response.answer
        );
      }
    } catch (err) {
      setSending(false);
      setError(err.message);
    }
  }

  function toggleWidget() {
    const next = !widgetOpen;

    setWidgetOpen(next);

    if (
      next &&
      items.length === 0
    ) {
      freshGreeting();
    }
  }

  function addUserMessage(text) {
    setItems(function (prev) {
      return prev.concat([
        {
          kind: "user",
          text: text,
        },
      ]);
    });
  }

  function getTicketParts(value) {
    const parts = value
      .split(",")
      .map(function (part) {
        return part.trim();
      })
      .filter(Boolean);

    let name = "";
    let email = "";
    let phone = "";

    parts.forEach(function (part) {
      if (part.includes("@")) {
        if (!email) {
          email = part;
        }
        return;
      }

      if (/^\d+$/.test(part)) {
        if (!phone) {
          phone = part;
        }
        return;
      }

      if (!name) {
        name = part;
      }
    });

    return {
      name: name,
      email: email,
      phone: phone,
    };
  }

  async function createTicket(
    name,
    email,
    phone
  ) {
    setSending(true);
    setError("");

    try {
      const ticket =
        await api.createPublicTicket({
          contact_name: name,
          contact_email: email,
          contact_phone: phone,
          subject:
            ticketQuestion.slice(
              0,
              80
            ) ||
            "Support Request",
          description:
            ticketQuestion,
        });

      const submittedQuestion =
        ticketQuestion;

      setSending(false);

      setTicketStage("none");
      setTicketField("all");
      setTicketQuestion("");
      setTicketName("");
      setTicketEmail("");
      setTicketPhone("");
      setDraft("");

      typeOutMessage(
        `Your request has been received for this question: "${submittedQuestion}"`,
        function () {
          setItems(function (prev) {
            return prev.concat([
              {
                kind: "ticket_card",
                ticket: ticket,
              },
            ]);
          });
        }
      );
    } catch (err) {
      setSending(false);
      setError(err.message);
    }
  }

  async function handleTicketDetails(
    value
  ) {
    const input = value.trim();

    setDraft("");
    setError("");

    /*
     * When the bot is specifically asking for EMAIL,
     * only accept an email here.
     *
     * This prevents a phone number from being
     * accidentally saved as the phone field.
     */
    if (
      ticketField === "email"
    ) {
      if (
        !EMAIL_PATTERN.test(input)
      ) {
        typeOutMessage(
          "Please provide a valid email address."
        );

        return;
      }

      setTicketEmail(input);

      /*
       * Email is now valid.
       * The next required field is PHONE.
       */
      setTicketField("phone");

      typeOutMessage(
        "Please provide your phone number."
      );

      return;
    }

    /*
     * When the bot is specifically asking for PHONE,
     * only accept a valid 10-digit phone number.
     */
    if (
      ticketField === "phone"
    ) {
      if (
        !PHONE_PATTERN.test(input)
      ) {
        typeOutMessage(
          "Please provide a valid phone number."
        );

        return;
      }

      setTicketPhone(input);

      /*
       * At this point name, email and phone
       * should already be available.
       */
      if (
        ticketName &&
        ticketEmail
      ) {
        await createTicket(
          ticketName,
          ticketEmail,
          input
        );

        return;
      }

      return;
    }

    /*
     * When all fields are initially requested,
     * allow the user to provide:
     *
     * Name, email, phone
     */
    const parts =
      getTicketParts(input);

    let name = ticketName;
    let email = ticketEmail;
    let phone = ticketPhone;

    if (parts.name) {
      name = parts.name;
    }

    if (parts.email) {
      email = parts.email;
    }

    if (parts.phone) {
      phone = parts.phone;
    }

    /*
     * Validate name if supplied.
     */
    if (
      name &&
      !NAME_PATTERN.test(name)
    ) {
      setTicketName("");
      setTicketEmail(email);
      setTicketPhone(phone);

      typeOutMessage(
        "Please provide a valid name using letters only."
      );

      return;
    }

    /*
     * Validate email if supplied.
     */
    if (
      email &&
      !EMAIL_PATTERN.test(email)
    ) {
      setTicketName(name);
      setTicketEmail("");
      setTicketPhone(phone);

      setTicketField("email");

      typeOutMessage(
        "Please provide a valid email address."
      );

      return;
    }

    /*
     * Validate phone if supplied.
     */
    if (
      phone &&
      !PHONE_PATTERN.test(phone)
    ) {
      setTicketName(name);
      setTicketEmail(email);
      setTicketPhone("");

      setTicketField("phone");

      typeOutMessage(
        "Please provide a valid phone number."
      );

      return;
    }

    /*
     * Save all currently valid values.
     */
    setTicketName(name);
    setTicketEmail(email);
    setTicketPhone(phone);

    /*
     * Ask only for the missing field.
     */
    if (!name) {
      setTicketField("name");

      typeOutMessage(
        "Please provide your name."
      );

      return;
    }

    if (!email) {
      setTicketField("email");

      typeOutMessage(
        "Please provide your email address."
      );

      return;
    }

    if (!phone) {
      setTicketField("phone");

      typeOutMessage(
        "Please provide your phone number."
      );

      return;
    }

    /*
     * All three fields are valid.
     * Now create the ticket.
     */
    await createTicket(
      name,
      email,
      phone
    );
  }

  async function submitQuestion(e) {
    e.preventDefault();

    const question =
      draft.trim();

    if (
      !question ||
      sending
    ) {
      return;
    }

    setError("");

    /*
     * Ticket contact collection.
     */
    if (
      ticketStage ===
      "collect"
    ) {
      addUserMessage(question);

      await handleTicketDetails(
        question
      );

      return;
    }

    setDraft("");
    setSending(true);

    /*
     * Initial name/question handling.
     */
    if (
      chatStage ===
      "name"
    ) {
      const looksLikeName =
        NAME_PATTERN.test(
          question
        );

      const looksLikeQuestion =
        QUESTION_PATTERN.test(
          question
        ) ||
        question.includes("?");

      if (
        looksLikeName &&
        !looksLikeQuestion
      ) {
        addUserMessage(question);

        try {
          const response =
            await api.publicChat(
              "__login_name__",
              [
                {
                  role: "user",
                  text: question,
                },
              ]
            );

          setSending(false);

          if (
            response &&
            response.answer
          ) {
            setChatStage(
              "chat"
            );

            typeOutMessage(
              response.answer
            );
          }
        } catch (err) {
          setSending(false);
          setError(
            err.message
          );
        }

        return;
      }

      /*
       * User directly asked a question.
       * Do not ask for name again.
       */
      addUserMessage(question);

      try {
        const response =
          await api.publicChat(
            question,
            buildHistory()
          );

        setSending(false);

        if (
          !response ||
          !response.answer
        ) {
          return;
        }

        if (
          response.source ===
          "ticket_form"
        ) {
          setTicketQuestion(
            response.question ||
              question
          );

          setTicketStage(
            "collect"
          );

          setTicketField("all");

          typeOutMessage(
            "I couldn't find a confident answer for your request. So please provide your name, email address, and phone number. We can raise a support ticket. The team will contact you shortly."
          );

          return;
        }

        setChatStage(
          "chat"
        );

        typeOutMessage(
          response.answer
        );
      } catch (err) {
        setSending(false);
        setError(
          err.message
        );
      }

      return;
    }

    /*
     * Normal chatbot question after name.
     */
    const history =
      buildHistory();

    addUserMessage(question);

    try {
      const response =
        await api.publicChat(
          question,
          history
        );

      setSending(false);

      if (
        !response ||
        !response.answer
      ) {
        return;
      }

      if (
        response.source ===
        "ticket_form"
      ) {
        setTicketQuestion(
          response.question ||
            question
        );

        setTicketStage(
          "collect"
        );

        setTicketField("all");

        typeOutMessage(
          "I couldn't find a confident answer for your request. So please provide your name, email address, and phone number. We can raise a support ticket. The team will contact you shortly."
        );

        return;
      }

      typeOutMessage(
        response.answer
      );
    } catch (err) {
      setSending(false);
      setError(err.message);
    }
  }

  return (
    <>
      <div
        onClick={toggleWidget}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center text-sm font-bold cursor-pointer shadow-lg z-50"
      >
        AI
      </div>

      {widgetOpen && (
        <div className="fixed bottom-24 right-6 w-[340px] h-[440px] bg-white border border-blue-200 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden">
          <div className="px-3.5 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold flex justify-between items-center">
            <span>
              AI Support
            </span>

            <span
              onClick={function () {
                setWidgetOpen(false);
                setItems([]);
                setDraft("");
                setError("");
                setChatStage("name");
                setTicketStage("none");
                setTicketField("all");
                setTicketQuestion("");
                setTicketName("");
                setTicketEmail("");
                setTicketPhone("");
                setSending(false);
              }}
              className="cursor-pointer text-sm"
            >
              ✕
            </span>
          </div>

          <div className="overflow-y-auto p-3 flex-1 flex flex-col gap-2 min-h-0">
            {items.map(function (
              item,
              index
            ) {
              if (
                item.kind ===
                "ticket_card"
              ) {
                return (
                  <div
                    key={index}
                    className="self-start max-w-[85%] mr-auto text-sm text-gray-900"
                  >
                    <div className="font-semibold">
                      Ticket ID: TKT-
                      {String(
                        item.ticket
                          .ticket_number
                      ).padStart(
                        4,
                        "0"
                      )}
                    </div>

                    <div className="text-gray-700 mt-1">
                      Our support team will review it and contact you shortly.
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className="flex flex-col gap-1.5"
                >
                  <div
                    className={`w-fit max-w-[80%] rounded-lg px-2.5 py-1.5 text-sm break-words whitespace-pre-line ${
                      item.kind ===
                      "bot"
                        ? "mr-auto bg-blue-50 text-gray-800 border border-blue-100"
                        : "ml-auto bg-gradient-to-r from-blue-600 to-cyan-500 text-white"
                    }`}
                  >
                    {item.text}
                  </div>
                </div>
              );
            })}

            {sending && (
              <div className="text-xs text-gray-400 self-start">
                Thinking...
              </div>
            )}

            {error && (
              <div className="text-xs text-red-500 self-start">
                {error}
              </div>
            )}

            <div ref={bottomRef}></div>
          </div>

          <form
            onSubmit={
              submitQuestion
            }
            className="flex items-center gap-1.5 p-2.5 border-t border-gray-100 relative"
          >
            <input
              value={draft}
              onChange={function (
                e
              ) {
                setDraft(
                  e.target.value
                );
              }}
              placeholder={
                ticketStage ===
                "collect"
                  ? "Name, email, phone..."
                  : "Ask anything..."
              }
              className="flex-1 text-sm border border-gray-300 rounded-lg px-2.5 py-2"
              disabled={sending}
            />

            <button
              type="submit"
              disabled={
                sending ||
                !draft.trim()
              }
              className="w-8.5 h-8.5 rounded-full border-none bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex items-center justify-center text-sm shrink-0 cursor-pointer"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}