/* eslint-disable no-param-reassign */
import onChange from 'on-change';

const renderValidation = (state, feedbackMsgElem, form, translator) => {
  const input = form.elements.url;
  console.log(state.uiState.form.message);
  feedbackMsgElem.textContent = translator.t(state.uiState.form.message);

  switch (state.addingFeedProcess) {
    case 'ready':
      feedbackMsgElem.classList.remove('text-danger');
      feedbackMsgElem.classList.add('text-success');
      input.classList.remove('is-invalid');
      input.classList.add('is-valid');
      form.reset();
      input.focus();
      break;
    case 'error':
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
    modalTitle, modalDescription, modalLink, postContainer,
  } = containers;
  const createCard = (post) => {
    const {
      pubDate, link, title, description, postId,
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
    const readStatus = state.uiState.notReadPosts.includes(postId) ? 'fw-bold' : 'fw-normal';
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

    buttonModal.addEventListener('click', () => {
      modalTitle.textContent = title;
      modalDescription.textContent = description;
      modalLink.setAttribute('href', link);
    });

    [cardLink, buttonModal].forEach((elem) => elem.addEventListener('click', (e) => {
      const { id } = e.target.dataset;
      state.uiState.notReadPosts = state.uiState.notReadPosts.filter((el) => el !== Number(id));
      state.uiState.readPosts.push(id);
    }));
    return card;
  }; // тут сортируем по дате, чтобы последние посты были сверху
  // в контроллере мы это делать не можем, потому что тогда ломается обновление фида через таймер
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
    feedWrapper.innerHTML = `
    <p><b>${feed.title}</b></p>
    <p>${feed.description}</p>`;
    return feedWrapper;
  });

  container.replaceChildren(...feedElems);
};

export default (state, containers, i18nInst) => {
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
    return null;
  });
  return watchedState;
};
