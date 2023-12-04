export default function PublicPage() {
  return (
    <section>
      <h3>Welcome</h3>

      <p>Login to use the app</p>

      <a href="/login">Login</a>
      <br />
      <br />
      <a href="/register">Register</a>

      <br />
      <p>The app works best if you save it as an app. </p>
      <h3>On iPhone</h3>
      <li>Open the page in Safari</li>
      <li>Click share on the bottom</li>
      <li>Click add to Home screen</li>
      <h3>On Android</h3>
      <li>Open the page in Chrome</li>
      <li>Click the three dots menu at the top right</li>
      <li>Click Add to Home screen</li>
    </section>
  );
}
