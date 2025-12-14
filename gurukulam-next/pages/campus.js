import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Campus() {
    return (
        <Layout>
            <Head>
                <title>Our Campus | Gurukulam</title>
            </Head>

            <section className="campus-hero">
                <div className="overlay"></div>
                <div className="container hero-container">
                    <div className="hero-content">
                        <h1 className="hero-title">Our Sacred Learning Space</h1>
                        <p className="hero-subtitle">Experience the tranquility of our traditional Gurukul campus.</p>
                    </div>
                </div>
            </section>

            <section className="campus-overview">
                <div className="container">
                    <div className="section-header">
                        <h2>Campus Overview</h2>
                        <p>A harmonious blend of traditional architecture and natural surroundings</p>
                    </div>
                    <div className="overview-content">
                        <div className="overview-text">
                            <p>Our Gurukulam campus is designed following ancient Vastu principles. Spread across 10 acres of lush greenery.</p>
                        </div>
                        <div className="overview-image">
                            <img src="/images/fire.jpg" alt="Gurukulam Campus Overview" />
                        </div>
                    </div>
                </div>
            </section>

            <section className="campus-facilities">
                <div className="container">
                    <div className="section-header">
                        <h2>Our Facilities</h2>
                    </div>
                    <div className="facilities-grid">
                        <div className="facility-card">
                            <div className="facility-icon"><i className="fas fa-home"></i></div>
                            <h3>Residential Quarters</h3>
                            <p>Simple, comfortable living spaces.</p>
                        </div>
                        <div className="facility-card">
                            <div className="facility-icon"><i className="fas fa-book"></i></div>
                            <h3>Learning Halls</h3>
                            <p>Traditional open halls (Shalas) with natural lighting.</p>
                        </div>
                        <div className="facility-card">
                            <div className="facility-icon"><i className="fas fa-pray"></i></div>
                            <h3>Meditation Spaces</h3>
                            <p>Dedicated areas for meditation.</p>
                        </div>
                    </div>
                </div>
            </section>
        </Layout>
    );
}
