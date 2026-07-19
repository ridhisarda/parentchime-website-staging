(function () {
  const card = document.getElementById('waitlist');
  const openButtons = document.querySelectorAll('[data-waitlist-open]');
  const closeButton = document.querySelector('[data-waitlist-close]');
  const form = document.querySelector('[data-waitlist-form]');
  const message = document.querySelector('[data-waitlist-message]');

  if (!card || !form || !message) return;

  function showWaitlist() {
    card.hidden = false;
    const email = form.querySelector('input[name="email"]');
    if (email instanceof HTMLElement) email.focus();
  }

  function hideWaitlist() {
    card.hidden = true;
    message.textContent = '';
    message.className = 'waitlist-message';
  }

  function setMessage(text, type) {
    message.textContent = text;
    message.className = `waitlist-message ${type}`;
  }

  openButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      showWaitlist();
    });
  });

  closeButton?.addEventListener('click', hideWaitlist);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = form.querySelector('button[type="submit"]');
    const data = new FormData(form);

    if (data.get('consent') !== 'on') {
      setMessage('Please confirm you would like Parentchime launch updates.', 'error');
      return;
    }

    const payload = {
      email: String(data.get('email') || '').trim(),
      first_name: String(data.get('first_name') || '').trim(),
      city: String(data.get('city') || '').trim(),
      country: String(data.get('country') || '').trim(),
      source: 'website_hero',
    };

    if (!payload.email) {
      setMessage('Please enter your email address.', 'error');
      return;
    }

    if (submit instanceof HTMLButtonElement) {
      submit.disabled = true;
      submit.textContent = 'Joining...';
    }
    setMessage('', 'success');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || 'Could not join the waitlist. Please try again.');
      }

      form.reset();
      setMessage("You're on the list. We'll email you when Parentchime is ready.", 'success');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not join the waitlist. Please try again.', 'error');
    } finally {
      if (submit instanceof HTMLButtonElement) {
        submit.disabled = false;
        submit.textContent = 'Join waitlist';
      }
    }
  });
})();
