# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-07-07

### 🎉 Initial Release

The first stable release of **Mermaid View Enhancer** brings comprehensive zoom and pan functionality to Mermaid diagrams in Obsidian.

### ✨ Features

#### **Core Functionality**
- **Smart Zoom System**
  - Mouse wheel zoom centered on cursor position
  - Zoom range: 100% (original size) to 300% (configurable up to 500%)
  - Fixed minimum zoom at 100% - no unwanted shrinking
  - Smooth, precise zoom increments

- **Unrestricted Pan Navigation**
  - Click and drag to pan at **any zoom level** (including 100%)
  - No more frustrating "zoom to pan" restrictions
  - Smooth drag experience with proper cursor feedback

- **Touch Device Support**
  - Pinch-to-zoom for tablets and mobile devices
  - Touch drag for panning
  - Full gesture compatibility

- **Quick Reset**
  - Double-click to instantly return to 100% zoom and center position
  - Consistent, predictable behavior

#### **Display Enhancements**
- **Flexible Container Width**
  - **Auto**: Use Obsidian's default width
  - **Custom**: Set specific pixel width for wide diagrams
  - **Full Width**: Expand to full window width
  - Perfect for large flowcharts and complex diagrams

#### **Customization Options**
- **Zoom Settings**
  - Adjustable maximum zoom level (200% - 500%)
  - Mouse wheel sensitivity control (25% - 200%)
  - Configurable animation speed (0 - 0.5 seconds)

- **User Experience**
  - Intuitive settings interface with percentage-based values
  - Real-time setting updates - no restart required
  - Clean, minimal configuration options

### 🔧 Technical Highlights

#### **Performance & Reliability**
- **Zero Dependencies**: No external libraries required
- **Memory Efficient**: Smart element tracking with data attributes
- **No Infinite Loops**: Robust DOM observation and event handling
- **Cross-Platform**: Works on Windows, macOS, Linux, iOS, and Android

#### **Smart Integration**
- **Automatic Detection**: Finds and enhances all Mermaid diagrams automatically
- **Dynamic Updates**: Detects new diagrams as you create them
- **Non-Destructive**: Cleanly removes enhancements when disabled
- **Backward Compatible**: Safe migration from any future setting changes

#### **Advanced Zoom Mathematics**
- **Precise Mouse-Centered Zoom**: Mathematical precision ensures zoom point stays under cursor
- **Transform Origin Optimization**: Uses `transform-origin: 0 0` for pixel-perfect scaling
- **Coordinate System**: Proper transformation matrix calculations for smooth experience

### 🎯 Design Philosophy

**Simplicity First**
- Minimal configuration required - works great out of the box
- Intuitive controls that feel natural
- No complex menus or overwhelming options

**Performance Focused**
- Lightweight implementation
- Efficient DOM manipulation
- Smooth 60fps animations

**User-Centric**
- Addresses real pain points with Mermaid diagram viewing
- Designed based on actual user workflows
- Accessible on all device types

### 📊 Supported Diagram Types

This plugin enhances **all** Mermaid diagram types within Obsidian preview mode:

- ✅ Flowcharts (`graph`, `flowchart`)
- ✅ Sequence Diagrams (`sequenceDiagram`)
- ✅ Class Diagrams (`classDiagram`)  
- ✅ State Diagrams (`stateDiagram`)
- ✅ Entity Relationship Diagrams (`erDiagram`)
- ✅ User Journey (`journey`)
- ✅ Gantt Charts (`gantt`)
- ✅ Pie Charts (`pie`)
- ✅ Requirement Diagrams (`requirementDiagram`)
- ✅ Gitgraph (`gitGraph`)
- ✅ C4 Diagrams (`C4Context`, `C4Container`, etc.)

### 🛠️ Development Notes

#### **Architecture Decisions**
- **Event-Driven Design**: Clean separation of concerns with dedicated event handlers
- **Declarative Configuration**: Type-safe settings with comprehensive defaults
- **Modular Codebase**: Easy to extend and maintain

#### **Quality Assurance**
- **TypeScript**: Full type safety and IntelliSense support
- **ESLint**: Code quality and consistency
- **Modern Browser APIs**: Uses latest web standards for best performance

### 🚀 Installation & Compatibility

- **Obsidian Version**: Requires Obsidian 0.15.0 or later
- **Platforms**: Desktop (Windows, macOS, Linux) and Mobile (iOS, Android)
- **File Size**: ~50KB (lightweight installation)
- **Startup Time**: Instant activation, no performance impact

### 💫 What's Next?

We're committed to continuous improvement based on community feedback. Future enhancements may include:

- Additional display modes and layouts
- Keyboard shortcuts for power users  
- Integration with other Obsidian diagram plugins
- Enhanced mobile gesture support

---

### 🙏 Special Thanks

This initial release was made possible by extensive testing and feedback from the Obsidian community. Thank you to everyone who helped identify pain points and suggested improvements!

**Happy diagramming!** 🎨📊