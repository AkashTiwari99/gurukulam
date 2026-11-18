import Head from 'next/head';
import Layout from '../components/Layout';
import styles from '../styles/campus.module.css';

export default function Campus() {
    return (
        <Layout>
            <Head>
                <title>Our Campus | Gurukulam</title>
            </Head>

            <section className={styles['campus-hero']}>
                <div className={styles.overlay}></div>
                <div className={`container ${styles['hero-container']}`}>
                    <div className={styles['hero-content']}>
                        <h1 className={styles['hero-title']}>Our Sacred Learning Space</h1>
                        <p className={styles['hero-subtitle']}>Experience the tranquility of our traditional Gurukul campus.</p>
                    </div>
                </div>
            </section>

            <section className={styles['campus-overview']}>
                <div className="container">
                    <div className={styles['section-header']}>
                        <h2>Campus Overview</h2>
                        <p>A harmonious blend of traditional architecture and natural surroundings</p>
                    </div>
                    <div className={styles['overview-content']}>
                        <div className={styles['overview-text']}>
                            <p>Our Gurukulam campus is designed following ancient Vastu principles. Spread across 10 acres of lush greenery.</p>
                        </div>
                        <div className={styles['overview-image']}>
                            <img src="/images/fire.webp" alt="Gurukulam Campus Overview" width={1200} height={808} loading="lazy" />
                        </div>
                    </div>
                </div>
            </section>

            <section className={styles['campus-facilities']}>
                <div className="container">
                    <div className={styles['section-header']}>
                        <h2>Our Facilities</h2>
                    </div>
                    <div className={styles['facilities-grid']}>
                        <div className={styles['facility-card']}>
                            <div className={styles['facility-icon']}><i className="fas fa-home" aria-hidden="true"></i></div>
                            <h3>Residential Quarters</h3>
                            <p>Simple, comfortable living spaces.</p>
                        </div>
                        <div className={styles['facility-card']}>
                            <div className={styles['facility-icon']}><i className="fas fa-book" aria-hidden="true"></i></div>
                            <h3>Learning Halls</h3>
                            <p>Traditional open halls (Shalas) with natural lighting.</p>
                        </div>
                        <div className={styles['facility-card']}>
                            <div className={styles['facility-icon']}><i className="fas fa-pray" aria-hidden="true"></i></div>
                            <h3>Meditation Spaces</h3>
                            <p>Dedicated areas for meditation.</p>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
