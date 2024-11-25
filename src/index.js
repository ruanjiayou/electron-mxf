import React, { Fragment, Component } from 'react';
import { useAsync, useEffectOnce } from 'react-use';
import { createRoot } from 'react-dom/client';
import { Observer } from 'mobx-react-lite'
// import 'antd/dist/antd.css';
import App from './app'

// 错误边界处理
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      info: null,
      isLoading: false,
      lastTime: Date.now()
    };
  }

  componentDidCatch(error, info) {
    this.setState({ hasError: true, error, info });
  }

  componentDidMount() {
    // TODO: loaded/error
  }

  render() {
    return <Fragment>
      {this.state.hasError ? <div>page error</div> : this.props.children}
    </Fragment>
  }
}

// 注入全局上下文
function Index() {
  const state = useAsync(async () => {
    try {
      return [];
    } catch (e) {
      console.log(e)
    }
  })
  return <Observer>{() => (
    state.loading ? <div style={{ width: "100vw", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>loading</div> : (state.error ? <div>error</div> : <App />)
  )}</Observer>
}

const root = createRoot(document.getElementById('root'))
root.render(
  <ErrorBoundary>
    <Index />
  </ErrorBoundary>,

);
