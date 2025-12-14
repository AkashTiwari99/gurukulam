import Head from 'next/head';
import Layout from '../components/Layout';

export default function Contact() {
    return (
        <Layout>
            <Head>
                <title>Contact Us | Gurukulam</title>
            </Head>

            <section className="contact-section">
                <div className="container">
                    <h2>Contact Us</h2>
                    <p>Reach out to us to begin your journey of wisdom.</p>

                    <form className="contact-form">
                        <input type="text" placeholder="Your Name" />
                        <input type="email" placeholder="Your Email" />
                        <textarea placeholder="Message"></textarea>
                        <button type="submit" className="btn btn-primary">Send Message</button>
                    </form>
                </div>
            </section>
        </Layout>
    );
}
