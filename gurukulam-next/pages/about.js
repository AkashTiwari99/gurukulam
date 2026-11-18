import Head from 'next/head';
import Layout from '../components/Layout';
import styles from '../styles/about.module.css';

export default function About() {
    return (
        <Layout>
            <Head>
                <title>About Gurukulam</title>
            </Head>

            <section className={styles.about}>
                <div className="container">
                    <h2>About Gurukulam</h2>
                    <p>Gurukulam is dedicated to reviving the ancient Vedic education system for modern times. We offer programs in Vedic Studies, Yoga, Sanskrit, and more.</p>
                    <img src="/images/card1.jpg" alt="Gurukul System" width={318} height={159} />
                    <h3>Our Mission</h3>
                    <p>To preserve and propagate the timeless wisdom of the Vedas and ancient Indian traditions.</p>
                </div>
            </section>
        </Layout>
    );
}
