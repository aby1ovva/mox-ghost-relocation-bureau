import { Component, type ErrorInfo, type ReactNode } from 'react';
import { STORAGE_KEY } from '../state/AppStateContext';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // В реальном продукте здесь была бы отправка в систему мониторинга ошибок.
    console.error('Необработанная ошибка в интерфейсе Бюро переселения:', error, info);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  handleResetStorage = () => {
    // "Попробовать снова" выше не помогает, если причина ошибки — повреждённые
    // данные в localStorage: React-состояние сбрасывается, но при следующем
    // рендере читается тот же битый JSON, и приложение падает снова. Эта кнопка
    // явно очищает сохранённые данные и перезагружает страницу с чистого листа.
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage может быть недоступен — тогда просто перезагружаем страницу
    }
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="error-fallback" role="alert">
          <h2>Что-то пошло не так</h2>
          <p>
            Бюро переселения столкнулось с неожиданной ошибкой и не смогло отрисовать этот
            экран. Попробуйте вернуться назад. Если ошибка повторяется — скорее всего,
            повреждены сохранённые данные; кнопка ниже сбросит их и начнёт заново.
          </p>
          <details>
            <summary>Техническая информация</summary>
            <pre>{this.state.error.message}</pre>
          </details>
          <button type="button" onClick={this.handleReset}>
            Попробовать снова
          </button>
          <button type="button" className="danger" onClick={this.handleResetStorage}>
            Сбросить сохранённые данные и начать заново
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
