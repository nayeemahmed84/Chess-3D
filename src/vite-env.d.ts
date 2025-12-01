/// <reference types="vite/client" />

// Declare audio file imports
declare module '*.mp3' {
    const src: string;
    export default src;
}

declare module '*.wav' {
    const src: string;
    export default src;
}

declare module '*.ogg' {
    const src: string;
    export default src;
}
