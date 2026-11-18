import Head from 'next/head';
import Link from 'next/link';
import Layout from '../components/Layout';
import styles from '../styles/programs.module.css';

export default function Programs() {
    return (
        <Layout>
            <Head>
                <title>Programs | Gurukulam</title>
            </Head>

            <section className={styles.programs}>
                <div className="container">
                    <h2>Our Programs</h2>
                    <p className={styles['section-description']}>Discover our comprehensive range of traditional learning programs.</p>

                    <div className={styles['programs-grid']}>
                        <div className={styles['program-card']}>
                            <div className={styles['card-icon']}>
                                <i className="fas fa-book-open" aria-hidden="true"></i>
                            </div>
                            <h3>Vedic Studies</h3>
                            <p>Immerse yourself in the ancient wisdom of the Vedas through our comprehensive courses.</p>
                            <Link href="/books" className={styles.button}>Explore Program</Link>
                        </div>

                        <div className={styles['program-card']}>
                            <div className={styles['card-icon']}>
                                <i className="fas fa-language" aria-hidden="true"></i>
                            </div>
                            <h3>Sanskrit Immersion</h3>
                            <p>Learn the divine language of Sanskrit through our immersive courses.</p>
                            <Link href="/sanatan-dharma" className={styles.button}>Begin Journey</Link>
                        </div>

                        <div className={styles['program-card']}>
                            <div className={styles['card-icon']}>
                                <i className="fas fa-spa" aria-hidden="true"></i>
                            </div>
                            <h3>Yoga &amp; Meditation</h3>
                            <p>Experience the physical and spiritual benefits of traditional Yoga.</p>
                            <Link href="/contact" className={styles.button}>Start Training</Link>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
