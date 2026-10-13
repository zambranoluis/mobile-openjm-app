import { Component } from "react";
import type { ReactNode } from "react";
import { View } from "react-native";

export class GraphicsFallback extends Component<{ children: ReactNode; fallback?: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? (this.props.fallback ?? <View />) : this.props.children; }
}
