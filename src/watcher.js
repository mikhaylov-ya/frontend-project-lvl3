/* eslint-disable no-param-reassign */
import onChange from 'on-change';

const renderValidation = (state, feedbackMsgElem, form, translator) => {
  const input = form.elements.url;

  switch (state.addingFeedProcess) {
    case 'ready':
      feedbackMsgElem.classList.remove('text-danger');
      feedbackMsgElem.classList.add('text-success');
      feedbackMsgElem.textContent = translator.t('validation.success');
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      form.reset();
      input.focus();
      break;
    case 'error':
      feedbackMsgElem.textContent = translator.t(state.uiState.form.error);
      feedbackMsgElem.classList.add('text-danger');
      input.classList.add('is-invalid');
      input.classList.remove('is-valid');
      break;
    default:
      throw new Error('Unknown form validation status!');
  }
};

const renderPosts = (state, containers) => {
  const {
    postContainer,
  } = containers;
  const createCard = (post) => {
    const {
      pubDate, link, title, postId,
    } = post;

    const dateOptions = {
      month: 'long',
      year: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };

    const card = document.createElement('div');
    card.classList.add('card-body', 'my-3');
    const cardTitle = document.createElement('h5');
    cardTitle.classList.add('card-title');
    const cardLink = document.createElement('a');
    cardLink.href = link;
    const readStatus = state.uiState.readPosts.includes(postId) ? 'fw-normal' : 'fw-bold';
    cardLink.classList.add(readStatus);
    cardLink.dataset.id = postId;
    cardLink.target = '_blank';
    cardLink.textContent = title;
    const cardSubtitle = document.createElement('h6');
    cardSubtitle.classList.add('card-subtitle', 'mb-2');
    cardSubtitle.textContent = new Date(pubDate)
      .toLocaleDateString('ru-RU', dateOptions);
    const buttonModal = document.createElement('button');
    buttonModal.classList.add('btn', 'btn-outline-dark');
    buttonModal.dataset.id = postId;
    buttonModal.dataset.bsToggle = 'modal';
    buttonModal.dataset.bsTarget = '#previewModal';
    buttonModal.textContent = 'Просмотр';
    cardTitle.append(cardLink);
    card.append(cardTitle, cardSubtitle, buttonModal);

    postContainer.addEventListener('click', (e) => {
      e.stopImmediatePropagation();
      const { id, bsToggle } = e.target.dataset;
      if (!id) return;

      if (bsToggle === 'modal') {
        state.uiState.currModal = postId;
      }

      state.uiState.readPosts.push(id);
    });
    return card;
  };

  const sortedPosts = state.data.posts.sort((a, b) => {
    const num1 = Number(a.pubDate);
    const num2 = Number(b.pubDate);
    return num2 - num1;
  });
  const cards = sortedPosts.map(createCard);
  postContainer.replaceChildren(...cards);
};

const renderFeeds = (feeds, container) => {
  const feedElems = feeds.map((feed) => {
    const feedWrapper = document.createElement('div');
    const feedTitle = document.createElement('p');
    feedTitle.classList.add('fw-bold');
    feedTitle.textContent = feed.title;
    const feedDescription = document.createElement('p');
    feedDescription.textContent = feed.description;
    feedWrapper.append(feedTitle, feedDescription);
    return feedWrapper;
  });

  container.replaceChildren(...feedElems);
};

export default (state, containers, i18nInst) => {
  const { modalDescription, modalTitle, modalLink } = containers;
  const mapping = {
    ready: () => {
      containers.submitBtn.disabled = false;
      renderValidation(state, containers.feedback, containers.form, i18nInst);
    },
    error: () => {
      containers.submitBtn.disabled = false;
      renderValidation(state, containers.feedback, containers.form, i18nInst);
    },
    processing: () => {
      containers.submitBtn.disabled = true;
    },
  };

  const watchedState = onChange(state, (path, val) => {
    if (path === 'addingFeedProcess') {
      mapping[val]();
    }
    if (path === 'data.posts') {
      renderPosts(watchedState, containers);
      renderFeeds(state.data.feeds, containers.feeds);
    }
    if (path === 'uiState.readPosts') {
      val.forEach((id) => {
        const post = document.querySelector(`a[data-id="${id}"]`);
        post.classList.remove('fw-bold');
        post.classList.add('fw-normal');
      });
    }
    if (path === 'uiState.currModal') {
      const post = state.data.posts.find(({ postId }) => postId === val);
      const { title, description, link } = post;
      modalTitle.textContent = title;
      modalDescription.textContent = description;
      modalLink.setAttribute('href', link);
    }
    return null;
  });
  return watchedState;
};
