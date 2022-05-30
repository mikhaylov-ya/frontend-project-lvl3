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
    cardSubtitle.textContent = pubDate.toLocaleDateString('ru-RU', dateOptions);
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

export default (state, containers) => {
  const watchedState = onChange(state, (path, val) => {
    // не знаю как сюда прокинуть другие данные - это же view, а не controller, а зачем перегружать
    // контроллер свичом с выделенным процессом я не понимаю, процесс там и так неявно работает
    if (path === 'addingFeedProcess') {
      switch (val) {
        case 'ready':
          state.uiState.form.disableSubmitBtn = false;
          break;
        case 'processing':
          state.uiState.form.disableSubmitBtn = true;
          break;
        case 'error':
          state.uiState.form.disableSubmitBtn = false;
          break;
        default:
          throw new Error(`Unknown process state: ${val}`);
      }
    }
    if (path === 'uiState.form.status') {
      renderValidation(val, containers.feedback, containers.form);
    }
    if (path === 'data.posts') {
      renderPosts(watchedState, containers);
      renderFeeds(state.data.feeds, containers.feeds);
    }
    if (path === 'uiState.form.disableSubmitBtn') {
      containers.submitBtn.disabled = val;
    }
    if (path === 'uiState.readPosts') {
      val.forEach((id) => {
        const post = document.querySelector(`a[data-id="${id}"]`);
        post.classList.remove('fw-bold');
        post.classList.add('fw-normal');
      });
    }
    if (path === 'uiState.addingFeedProcess') {
      return null;
    }
    return null;
  });
  return watchedState;
};
