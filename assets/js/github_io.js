const OWNER = 'LeoGuagenti';
const REPO = 'test-blog';
const PATH = 'data';
const TOKEN = process.env.GITHUB_TOKEN

// Headers for GitHub API requests
const headers = {
    'Authorization': `token ${TOKEN}`,
    'Accept': 'application/vnd.github.v3+json',
    'Content-Type': 'application/json'
};

// Function to read files in the data folder
async function listFilesInDataFolder() {
    try {
        const response = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}/contents/${PATH}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Failed to list files: ${response.status} ${response.statusText}`);
        }

        const files = await response.json();
        console.log('Files in data folder:', files);

        for (const file of files) {
            if (file.type === 'file') {
                await getFileContent(file.path);
            }
        }
    } catch (error) {
        console.error('Error listing files:', error.message);
    }
}

// Function to get the content of a specific file
async function getFileContent(filePath) {
    try {
        const response = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${filePath}`, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch file ${filePath}: ${response.status} ${response.statusText}`);
        }

        const fileData = await response.json();
        // Decode base64 content
        const content = atob(fileData.content);
        console.log(`Content of ${filePath}:`, content);
        return content;
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error.message);
    }
}

// Function to upload a file to the data folder
async function uploadFileToDataFolder(fileName, content) {
    try {
        const filePath = `${PATH}/${fileName}`;
        // Encode content to base64
        const encodedContent = btoa(content);

        // Check if file already exists to get its SHA (required for updates)
        let sha = null;
        try {
            const existingFile = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${filePath}`, {
                method: 'GET',
                headers: headers
            });
            if (existingFile.ok) {
                const fileData = await existingFile.json();
                sha = fileData.sha;
            }
        } catch (error) {
            // File doesn't exist, proceed without SHA
        }

        // Prepare the request body
        const body = {
            message: `Add ${fileName} to ${PATH}`,
            content: encodedContent,
            branch: 'main' // Replace with your branch if different
        };
        if (sha) {
            body.sha = sha; // Include SHA if updating an existing file
        }

        const response = await fetch(`${GITHUB_API}/repos/${OWNER}/${REPO}/contents/${filePath}`, {
            method: 'PUT',
            headers: headers,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            throw new Error(`Failed to upload file ${fileName}: ${response.status} ${response.statusText}`);
        }

        const result = await response.json();
        console.log(`File ${fileName} uploaded successfully:`, result);
        return result;
    } catch (error) {
        console.error(`Error uploading file ${fileName}:`, error.message);
    }
}

// Example usage
async function main() {
    // List all files in the data folder
    await listFilesInDataFolder();

    // Upload a sample file
    const sampleContent = 'This is a sample file content.';
    await uploadFileToDataFolder('sample.txt', sampleContent);
}

window.onload = main()