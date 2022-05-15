/* eslint-disable no-param-reassign */
import onChange from 'on-change';

const renderValidation = (status, feedbackMsgElem, form) => {
  const input = form.elements.url;
  feedbackMsgElem.textContent = status.message;

  switch (status.isValid) {
    case true:
      feedbackMsgElem.classList.remove('text-danger');
      feedbackMsgElem.classList.add('text-success');
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      form.reset();
      input.focus();
      break;
    case false:
      feedbackMsgElem.classList.add('text-danger');
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      break;
    default:
      throw new Error('Unknown form validation status!');
  }
};

const renderPosts = (posts, container) => {
  const createCard = (post) => {
    const card = document.createElement('div');
    card.classList.add('card', 'my-3');
    const date = post.pubDate;
    const dateOptions = {
      month: 'long',
      year: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    card.innerHTML = `
      <div class="card-body">
        <h5 class="card-title"><a class="card-link" href="${post.link}" target="_blank">${post.title}</a></h5>
        <h6 class="card-subtitle mb-2">${date.toLocaleDateString('ru-RU', dateOptions)}</h6>
        <p class="card-text">${post.description}</p>
      </div>`;
    return card;
  };

  const cards = posts.map(createCard);
  container.replaceChildren(...cards);
};

const renderFeeds = (feeds, container) => {
  const feedElems = feeds.map((feed) => {
    const feedWrapper = document.createElement('div');
    feedWrapper.innerHTML = `
    <p><b>${feed.title}</b></p>
    <p>${feed.description}</p>`;
    return feedWrapper;
  });

  container.replaceChildren(...feedElems);
};

export default (state, containers) => {
  const watchedState = onChange(state, (path, val) => {
    if (path === 'form.status') {
      renderValidation(val, containers.feedback, containers.form);
    }
    if (path === 'form.data.feeds') {
      renderPosts(state.form.data.posts, containers.posts);
      renderFeeds(state.form.data.feeds, containers.feeds);
    }
  });
  return watchedState;
};
