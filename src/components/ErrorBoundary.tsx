import { Component, type ErrorInfo, type ReactNode } from 'react';

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

  render() {
    if (this.state.error) {
      return (
        <div className="error-fallback" role="alert">
          <h2>Что-то пошло не так</h2>
          <p>
            Бюро переселения столкнулось с неожиданной ошибкой и не смогло отрисовать этот
            экран. Попробуйте вернуться назад — данные в хранилище не повреждены.
          </p>
          <details>
            <summary>Техническая информация</summary>
            <pre>{this.state.error.message}</pre>
          </details>
          <button type="button" onClick={this.handleReset}>
            Попробовать снова
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
