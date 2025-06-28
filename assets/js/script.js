let currentPosts = [];

async function getPosts() {
  try {
    const json = document.getElementById('savedOutput')?.value || localStorage.getItem('savedPost');
    if (!json) {
      console.warn('No saved posts found.');
      return [];
    }
    const postData = JSON.parse(json);
    // Ensure posts is an array, wrapping single post if needed
    const posts = Array.isArray(postData) ? postData : [{ id: Date.now().toString(), content: postData.content }];
    currentPosts.length = 0;
    currentPosts.push(...posts);
    return posts;
  } catch (error) {
    console.error('Error loading posts from JSON:', error.message);
    return [];
  }
}

function sortPosts() {
  const sortOrder = document.getElementById('sortOrder')?.value;
  if (!sortOrder) return;
  const sortedPosts = [...currentPosts].sort((a, b) => {
    const dateA = new Date(parseInt(a.id) || Date.now());
    const dateB = new Date(parseInt(b.id) || Date.now());
    return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
  });
  renderPosts(sortedPosts);
}

function renderPosts(posts) {
  const postsContainer = document.getElementById('posts');
  if (!postsContainer) return;
  postsContainer.innerHTML = '';
  posts.forEach(post => {
    try {
      let title = '';
      let date = 'Unknown Date';
      let excerpt = '';
      let imageUrl = '';

      try {
        // Generate title from first text content
        title = post.content?.find(item => item.type === 'text')?.content.slice(0, 30) || 'Untitled';
      } catch (error) {
        console.warn(`Error rendering title for post ${post.id}:`, error.message);
      }

      try {
        // Use post ID as timestamp for date
        const parsedDate = new Date(parseInt(post.id));
        if (!isNaN(parsedDate)) {
          date = parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
      } catch (error) {
        console.warn(`Error rendering date for post ${post.id}:`, error.message);
      }

      try {
        // Generate excerpt and extract first image
        let textContent = '';
        post.content?.forEach(item => {
          if (item.type === 'media' && !imageUrl) {
            imageUrl = item.base64;
          } else if (item.type === 'text') {
            let text = item.content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
            if (item.attributes) {
              if (item.attributes.bold) text = `<strong>${text}</strong>`;
              if (item.attributes.italic) text = `<em>${text}</em>`;
              if (item.attributes.underline) text = `<u>${text}</u>`;
              if (item.attributes.strike) text = `<s>${text}</s>`;
              if (item.attributes.color) text = `<span style="color: ${item.attributes.color}">${text}</span>`;
              if (item.attributes.background) text = `<span style="background-color: ${item.attributes.background}">${text}</span>`;
              if (item.attributes.size) {
                const sizes = { small: '0.8em', large: '1.2em', huge: '1.5em' };
                text = `<span style="font-size: ${sizes[item.attributes.size] || '1em'}">${text}</span>`;
              }
              if (item.attributes.list === 'ordered') text = `<li>${text}</li>`;
              if (item.attributes.list === 'bullet') text = `<li>${text}</li>`;
            }
            textContent += item.attributes?.list ? text : `<p>${text}</p>`;
          }
        });
        excerpt = textContent.length > 100 ? textContent.substring(0, 100) + '...' : textContent;
      } catch (error) {
        console.warn(`Error rendering excerpt for post ${post.id}:`, error.message);
        excerpt = 'Unable to render excerpt.';
      }

      const postElement = document.createElement('article');
      postElement.className = 'card bg-body-secondary border-0 text-white mb-4';
      postElement.innerHTML = `
        <div class="card-body">
          <h2 class="card-title h5">${title}</h2>
          <p class="card-text text-muted small">${date}</p>
          <div class="row">
            ${imageUrl ? `
              <div class="col-md-4 mb-3 mb-md-0">
                <img src="${imageUrl}" alt="Post image" class="img-fluid rounded" style="width: 100%; height: 150px; object-fit: cover;">
              </div>
              <div class="col-md-8">
                <div class="card-text">${excerpt}</div>
              </div>
            ` : `
              <div class="col-12">
                <div class="card-text">${excerpt}</div>
              </div>
            `}
          </div>
          <a href="post.html?id=${post.id}" class="btn btn-primary mt-2">Read More</a>
        </div>
      `;
      postsContainer.appendChild(postElement);
    } catch (error) {
      console.warn(`Error rendering post ${post.id}:`, error.message);
      const postElement = document.createElement('article');
      postElement.className = 'card bg-dark border-0 text-white mb-4';
      postElement.innerHTML = `
        <div class="card-body">
          <h2 class="card-title h5">Post unavailable</h2>
          <p class="card-text text-muted small">Unable to load this post.</p>
        </div>
      `;
      postsContainer.appendChild(postElement);
    }
  });
}

async function renderPost() {
  const postElement = document.getElementById('post');
  if (!postElement) return;
  try {
    const posts = await getPosts();
    const post = posts.find(p => p.id === new URLSearchParams(window.location.search).get('id'));
    if (!post) {
      postElement.innerHTML = '<p>Post not found.</p>';
      return;
    }

    let title = '';
    let date = 'Unknown Date';
    let body = '';

    try {
      title = post.content?.find(item => item.type === 'text')?.content.slice(0, 30) || 'Untitled';
    } catch (error) {
      console.warn(`Error rendering title for post ${post.id}:`, error.message);
    }

    try {
      const parsedDate = new Date(parseInt(post.id));
      if (!isNaN(parsedDate)) {
        date = parsedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      }
    } catch (error) {
      console.warn(`Error rendering date for post ${post.id}:`, error.message);
    }

    try {
      post.content?.forEach(item => {
        if (item.type === 'media') {
          body += `<div class="media-container"><img src="${item.base64}" alt="Uploaded image" class="img-fluid rounded" style="max-width: 100%; height: auto;"></div>`;
        } else if (item.type === 'text') {
          let text = item.content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
          if (item.attributes) {
            if (item.attributes.bold) text = `<strong>${text}</strong>`;
            if (item.attributes.italic) text = `<em>${text}</em>`;
            if (item.attributes.underline) text = `<u>${text}</u>`;
            if (item.attributes.strike) text = `<s>${text}</s>`;
            if (item.attributes.color) text = `<span style="color: ${item.attributes.color}">${text}</span>`;
            if (item.attributes.background) text = `<span style="background-color: ${item.attributes.background}">${text}</span>`;
            if (item.attributes.size) {
              const sizes = { small: '0.8em', large: '1.2em', huge: '1.5em' };
              text = `<span style="font-size: ${sizes[item.attributes.size] || '1em'}">${text}</span>`;
            }
            if (item.attributes.list === 'ordered') text = `<li>${text}</li>`;
            if (item.attributes.list === 'bullet') text = `<li>${text}</li>`;
          }
          body += item.attributes?.list ? `<${item.attributes.list === 'ordered' ? 'ol' : 'ul'}>${text}</${item.attributes.list === 'ordered' ? 'ol' : 'ul'}>` : `<p>${text}</p>`;
        }
      });
    } catch (error) {
      console.warn(`Error rendering body for post ${post.id}:`, error.message);
      body = '<p>Unable to render post content.</p>';
    }

    postElement.innerHTML = `
      <h1 class="card-title h3">${title}</h1>
      <p class="card-text text-muted small">${date}</p>
      <div class="card-text">${body}</div>
    `;
  } catch (error) {
    console.error('Error rendering post:', error.message);
    postElement.innerHTML = `
      <h1 class="card-title h3">Post unavailable</h1>
      <p class="card-text text-muted small">Unable to load this post.</p>
    `;
  }
}

// Load posts or post based on page
if (document.getElementById('posts')) {
  getPosts().then(posts => {
    sortPosts();
    renderPosts(posts);
  }).catch(error => console.error('Error loading posts:', error.message));
} else if (document.getElementById('post')) {
  renderPost().catch(error => console.error('Error loading post:', error.message));
}