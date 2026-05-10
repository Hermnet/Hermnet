import React from 'react';
import renderer, { act } from 'react-test-renderer';
import App from '../App';

describe('<App />', () => {
  it('se renderiza correctamente (Snapshot)', async () => {
    jest.useFakeTimers();
    let component: renderer.ReactTestRenderer;
    
    await act(async () => {
      component = renderer.create(<App />);
      jest.runOnlyPendingTimers();
    });

    expect(component!.toJSON()).toMatchSnapshot();

    await act(async () => {
      component!.unmount();
    });
    jest.useRealTimers();
  });
});
