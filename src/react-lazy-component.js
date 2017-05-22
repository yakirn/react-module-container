import React from 'react';
import {filesAppender} from './tag-appender';
import transform from 'lodash/transform';

class ReactLazyComponent extends React.Component {
  constructor(props, manifest) {
    super(props);
    this.manifest = manifest;
    this.state = {component: null};
  }

  componentWillMount() {
    this.filesAppenderPromise = filesAppender(this.manifest.files);

    // execute each resolve function
    // save both resolve key and resolve execution promise
    // so when later constructing the result object
    // we can ensure the order for the relation between key -> result
    this.transformedResolve = transform(this.manifest.resolve, (result, value, key) => {
      const resolvePromise = value();
      result.keys.push(key);
      result.promises.push(resolvePromise);
    }, {
      keys: [],
      promises: []
    });
  }

  componentDidMount() {
    Promise.all([this.filesAppenderPromise, ...this.transformedResolve.promises]).then(results => {
      // constructing the result of the 'resolve' object, while order is guaranteed
      const resolvedResults = results.slice(1);
      this.resolvedProps = {};
      for (let i = 0; i < this.transformedResolve.keys.length; i++) {
        this.resolvedProps[this.transformedResolve.keys[i]] = resolvedResults[i];
      }

      const component = window.ModuleRegistry.component(this.manifest.component);
      this.setState({component});
    });
  }

  render() {
    return this.state.component ? <this.state.component {...this.props} {...this.resolvedProps}/> : null;
  }
}

export default ReactLazyComponent;
