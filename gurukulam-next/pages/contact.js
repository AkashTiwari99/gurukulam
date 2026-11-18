import Head from 'next/head';
import { useState } from 'react';
import Layout from '../components/Layout';
import styles from '../styles/contact.module.css';

const CONTACT_EMAIL = 'contact@gurukulam.org';

export default function Contact() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState(null);
    const [mailtoHref, setMailtoHref] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();

        const trimmedName = name.trim();
        const trimmedEmail = email.trim();
        const trimmedMessage = message.trim();

        if (!trimmedName || !trimmedEmail || !trimmedMessage) {
            setStatus({
                type: 'error',
                text: 'Please fill in your name, email address, and message before sending.',
            });
            setMailtoHref('');
            return;
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(trimmedEmail)) {
            setStatus({
                type: 'error',
                text: 'Please enter a valid email address.',
            });
            setMailtoHref('');
            return;
        }

        const subject = encodeURIComponent(`Gurukulam Inquiry from ${trimmedName}`);
        const body = encodeURIComponent(
            `Name: ${trimmedName}\nEmail: ${trimmedEmail}\n\nMessage:\n${trimmedMessage}`
        );
        const href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

        setMailtoHref(href);
        setStatus({
            type: 'success',
            text: 'Your email client has been prepared with your inquiry. If it did not open automatically, use the direct email link below.',
        });

        window.location.href = href;
    };

    return (
        <Layout>
            <Head>
                <title>Contact Us | Gurukulam</title>
            </Head>

            <section className={styles['contact-section']}>
                <div className={`container ${styles['contact-container']}`}>
                    <div className={styles['form-card']}>
                        <h1>Contact Us</h1>
                        <p className={styles['form-subtitle']}>
                            Reach out to us to begin your journey of wisdom.
                        </p>

                        <form className={styles['contact-form']} onSubmit={handleSubmit} noValidate>
                            <div className={styles['form-group']}>
                                <label htmlFor="contact-name" className={styles['form-label']}>
                                    Your Name
                                </label>
                                <div className={styles['form-field']}>
                                    <i className="fas fa-user" aria-hidden="true"></i>
                                    <input
                                        id="contact-name"
                                        name="name"
                                        type="text"
                                        placeholder="Your Name"
                                        aria-label="Your Name"
                                        required
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="contact-email" className={styles['form-label']}>
                                    Your Email
                                </label>
                                <div className={styles['form-field']}>
                                    <i className="fas fa-envelope" aria-hidden="true"></i>
                                    <input
                                        id="contact-email"
                                        name="email"
                                        type="email"
                                        placeholder="Your Email"
                                        aria-label="Your Email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={styles['form-group']}>
                                <label htmlFor="contact-message" className={styles['form-label']}>
                                    Message
                                </label>
                                <div className={styles['form-field']}>
                                    <i className="fas fa-comment-alt" aria-hidden="true"></i>
                                    <textarea
                                        id="contact-message"
                                        name="message"
                                        placeholder="Message"
                                        aria-label="Message"
                                        required
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button type="submit" className={styles['submit-btn']}>
                                <span>Send Message</span>
                                <i className="fas fa-paper-plane" aria-hidden="true"></i>
                            </button>

                            {status && (
                                <div
                                    role={status.type === 'error' ? 'alert' : 'status'}
                                    aria-live="polite"
                                    className={`${styles['status-message']} ${
                                        status.type === 'error'
                                            ? styles['status-error']
                                            : styles['status-success']
                                    }`}
                                >
                                    <p>{status.text}</p>
                                    {mailtoHref && (
                                        <p style={{ marginTop: '8px' }}>
                                            <a href={mailtoHref} className={styles['status-link']}>
                                                Open email to {CONTACT_EMAIL}
                                            </a>
                                        </p>
                                    )}
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
