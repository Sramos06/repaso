import { signIn } from "@/lib/auth";

export default function SignIn() {
  return (
    <main className="signin-wrap">
      <div className="signin-card">
        <h1>Repa<em>so</em></h1>
        <p>Your reviewers, kept safe.</p>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button type="submit" className="google-btn">Continue with Google</button>
        </form>
      </div>
    </main>
  );
}
