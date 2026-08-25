export const metadata = { title: "Privacy Policy - gizycko" };

export default function PrivacyPage() {
  return (
    <>
      <h1>Privacy Policy</h1>
      <p>
        This explains what gizycko.online collects, why, and what you can do
        about it. It is written against the GDPR (Regulation (EU) 2016/679)
        because that is the strictest regime the service is likely to meet. If
        your country gives you stronger rights - the UK GDPR, California&rsquo;s
        CCPA/CPRA, Brazil&rsquo;s LGPD and others do in places - those apply to
        you as well.
      </p>

      <h2>Who is responsible</h2>
      <p>
        The data controller is <strong>[company name]</strong>,{" "}
        <strong>[registered address]</strong>, contactable at{" "}
        <strong>[contact email]</strong>. If we are required to appoint a
        representative or data protection officer in your region, their details
        belong here too.
      </p>

      <h2>What we collect</h2>
      <ul>
        <li>
          <strong>Account data</strong> - name, email address, password (stored
          only as a hash), sign-in timestamps, IP address, and user agent.
        </li>
        <li>
          <strong>Profile data</strong> - display name, date of birth, gender,
          who you want to meet, city, occupation, biography, and photographs.
        </li>
        <li>
          <strong>Activity data</strong> - likes and passes, matches, messages,
          posts, comments, reactions, friendships, blocks, and reports.
        </li>
      </ul>

      <h2>Special category data</h2>
      <p>
        Who you want to meet can reveal your sexual orientation, and what you
        write about yourself may reveal health, religion, or political views.
        Under Article 9 GDPR this is special category data. We process it{" "}
        <strong>only on your explicit consent</strong>, which you give when you
        complete your profile and can withdraw at any time by editing or
        deleting your profile.
      </p>

      <h2>Why we process it, and on what basis</h2>
      <ul>
        <li>
          <strong>To run the service</strong> - matching, messaging, the feed.
          Basis: performance of our contract with you (Art. 6(1)(b)).
        </li>
        <li>
          <strong>To keep people safe</strong> - moderation, blocks, reports,
          bans, fraud prevention. Basis: our legitimate interest in a safe
          platform (Art. 6(1)(f)).
        </li>
        <li>
          <strong>To meet legal duties</strong> - responding to lawful requests,
          keeping records we are required to keep. Basis: legal obligation (Art.
          6(1)(c)).
        </li>
      </ul>

      <h2>Who can see what</h2>
      <p>
        Your display name, age, city, biography, and photographs are visible to
        other signed-in members. Your exact date of birth and email address are
        never shown - only your age is. Posts respect the visibility you choose
        for each one. Messages are visible only to you and the person you are
        matched with, and to moderators when a report is made.
      </p>

      <h2>Who we share it with</h2>
      <p>
        Processors that host and operate the service on our behalf, under
        written contracts: <strong>[hosting provider]</strong>,{" "}
        <strong>[database provider]</strong>, <strong>[email provider]</strong>.
        We do not sell personal data. We do not use it to train AI models.
      </p>

      <h2>Where it is stored</h2>
      <p>
        In <strong>[region]</strong>. Because the service is open worldwide,
        your data may be processed in a country other than your own. Transfers
        out of the European Economic Area or the UK rely on the European
        Commission&rsquo;s Standard Contractual Clauses or the UK equivalent,
        and transfers elsewhere on the safeguard that country&rsquo;s law
        requires.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Account and profile data: until you delete your account.</li>
        <li>
          After deletion: removed within 30 days, except records of bans and
          serious safety reports, which we keep for up to 2 years to stop banned
          users returning.
        </li>
        <li>Server logs: 90 days.</li>
      </ul>

      <h2>Your rights</h2>
      <p>
        You may access, correct, erase, restrict, or object to processing of
        your data, and receive a copy in a portable format. Use{" "}
        <strong>Download my data</strong> and <strong>Delete my account</strong>{" "}
        on your profile page, or write to us. You may withdraw consent at any
        time without affecting processing already carried out.
      </p>
      <p>
        You may also complain to your national data protection authority. In the
        EU that is the regulator where you live or work; in the UK, the
        Information Commissioner&rsquo;s Office.
      </p>

      <h2>Cookies</h2>
      <p>
        We set one strictly necessary cookie to keep you signed in. It requires
        no consent. We do not use advertising or analytics cookies. If that
        changes, we will ask first.
      </p>

      <h2>Children</h2>
      <p>
        The service is for adults. We check date of birth at sign-up and remove
        accounts found to belong to anyone under 18. Report an underage account
        with the report button on any profile.
      </p>
    </>
  );
}
