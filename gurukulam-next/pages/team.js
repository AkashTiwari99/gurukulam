import Head from 'next/head';
import Layout from '../components/Layout';

export default function Team() {
    return (
        <Layout>
            <Head>
                <title>Our Team | Gurukulam</title>
            </Head>
            <div className="container" style={{ padding: '4rem 0', textAlign: 'center' }}>
                <h1>Our Team</h1>
                <p>Meet the dedicated individuals behind Gurukulam.</p>
                <p style={{ marginTop: '2rem', color: '#666' }}>Content coming soon...</p>
            </div>
        </Layout>
    );
}
