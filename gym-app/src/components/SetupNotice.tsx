export function SetupNotice() {
  return (
    <div className="message">
      <h1>Firebase is not set up yet</h1>
      <p>
        Add your Firebase web keys to <code>.env.local</code> and restart <code>npm run dev</code>. The steps are in the
        README under “Accounts and admin”.
      </p>
    </div>
  );
}
