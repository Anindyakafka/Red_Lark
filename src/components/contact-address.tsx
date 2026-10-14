export function ContactAddress({ email }: { email: string }) {
  if (!email)
    return (
      <p className="contact-placeholder">
        <strong>[CONTACT ADDRESS NOT SET]</strong>
        <br />
        The project has not supplied its real contact inbox. This is a visible placeholder, not a
        working address.
      </p>
    );
  const [name, domain] = email.split("@");
  return (
    <p>
      <span className="sr-only">Contact email: </span>
      <span aria-label={email}>
        {name}
        <span aria-hidden="true"> [at] </span>
        <span className="sr-only">@</span>
        {domain.split(".").map((part, i) => (
          <span key={i}>
            {i > 0 && (
              <>
                <span aria-hidden="true"> [dot] </span>
                <span className="sr-only">.</span>
              </>
            )}
            {part}
          </span>
        ))}
      </span>
    </p>
  );
}
