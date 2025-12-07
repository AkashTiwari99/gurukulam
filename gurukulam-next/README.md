# Next.js Migration Instructions

The code for your new high-performance Next.js website has been generated in the `gurukulam-next` folder.
Due to environment restrictions, some assets could not be moved automatically. Please follow these steps to finish the setup:

1. **Open your terminal** and navigate to the project:
   ```bash
   cd "c:\akash tiwari\gurukulam\gurukulam-next"
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Copy Assets** (Manual Step):
   - Copy the folder `c:\akash tiwari\gurukulam\images` into `c:\akash tiwari\gurukulam\gurukulam-next\public\`
   - Copy the folder `c:\akash tiwari\gurukulam\styles` into `c:\akash tiwari\gurukulam\gurukulam-next\`

   *Your folder structure should look like:*
   ```
   gurukulam-next/
   ├── components/
   ├── pages/
   ├── public/
       └── images/   <-- Images here
   ├── styles/       <-- CSS files here
   ├── package.json
   └── ...
   ```

4. **Start the Server**:
   ```bash
   npm run dev
   ```

5. **View Your Site**:
   open http://localhost:3000

The site should now be fully functional, responsive, and ready for future database integration!
