# OCSS
Orientation-driven CSS: Simplify responsive design based on device orientation

## Quick Start

#### Without installing
```bash
npx @levihub/ocss
```

#### Installing
```bash
npm i -g @levihub/ocss
ocss
```

## Explanation

OCSS automatically watches `.o.css` files in your project and generates corresponding CSS files with appropriate media queries.

Simply create your styles using the `:view` syntax and define `desktop` or/and `mobile` variants within each selector.

## Usage/Examples

### Input file: `styles.o.css`
```css
main:view {
    height: 100vh;
    desktop {
        width: 800px;
    }
}

ul:view {
    display: flex;
    mobile {
        flex-direction: column;
    }
}

li:view {
    desktop {
        display: inline-block;
    }
    mobile {
        display: block;
        width: 100%;
    }
}
```

### Output: `styles.css`
```css
main {
    height: 100vh;
}

ul {
    display: flex;
}


@media screen and (orientation: landscape) {
    main {
        width: 800px;
    }
    li {
        display: inline-block;
    }
}

@media screen and (orientation: portrait) {
    ul {
        flex-direction: column;
    }
    li {
        display: block;
        width: 100%;
    }
}
```