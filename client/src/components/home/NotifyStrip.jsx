import { useState } from "react";
import { useText } from "../../store/ContentContext.jsx";
import EditableText from "../common/EditableText.jsx";
import api from "../../lib/api.js";

export default function NotifyStrip() {
  const placeholder = useText("notify.placeholder", "Enter your email");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      await api.post("/subscribers", { email });
      setDone(true);
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="bg-dark py-10 text-white md:py-14">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-6">
        <h2 className="text-xl font-bold md:text-2xl">
          <EditableText keyName="notify.headline" fallback="Never miss a Bloc" />
        </h2>
        <p className="mt-2 text-sm text-gray-300">
          <EditableText keyName="notify.subtext" fallback="Get notified when new deals go live." />
        </p>
        <form onSubmit={submit} className="mx-auto mt-5 flex max-w-md flex-col gap-2 sm:flex-row">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => { setEmail(e.target.value); setDone(false); }}
            placeholder={placeholder}
            className="flex-1 rounded-full border border-gray-600 bg-dark-soft px-5 py-3 text-sm outline-none focus:border-brand"
          />
          <button disabled={loading} className="rounded-full bg-brand px-6 py-3 text-sm font-bold transition hover:bg-brand-hover disabled:opacity-60 sm:w-auto w-full">
            <EditableText keyName="notify.ctaText" fallback="Notify Me" />
          </button>
        </form>
        {done && <p className="mt-3 text-sm text-success">✓ You're on the list!</p>}
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </div>
    </section>
  );
}
