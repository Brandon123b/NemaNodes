
//Static class contains tools to generate and manipulate nematode bodies 
class SpriteGenerator {

    //global sprite variables
    static MAX_BODY_CHUNKS = 12;
    static chunk_distance = 50;
    static head_mids_distance = 0;
    static mids_tail_distance = 70;
    static chunk_y = 0;
    static eye_head_offset = [0,-7] //Where to put the eye, relative to the head

    //arrays hold all possible body parts
    static heads = [];
    static tails = [];
    static mids = [];
    static eyes = [];

    //load all sprite parts into arrays
    //need to call this before using the class
    static LoadspriteChunks() {

        this.eyes.push(PIXI.Texture.from('art/eyes_cropped.png'));
        this.tails.push(PIXI.Texture.from('art/tail_cropped.png'));
        this.heads.push(PIXI.Texture.from('art/head_cropped.png'));
        this.mids.push(PIXI.Texture.from('art/mids_cropped.png'));

    }

    //Generate a texture that can then be either used as a sprite or attached to a rope
    //input: nematode to generate sprite for
    //output: a PIXI texture object
    static GenerateNematodeTexture(nematode) {
        
        //how long is the nematode?
        let n_chunks = Math.floor(Math.random()*this.MAX_BODY_CHUNKS);

        //Choose body parts (only one of each for now)
        let nhead = this.heads[0];
        let mids = this.mids[0];
        let ntail = this.tails[0];
        let neyes = this.eyes[0];

        //Container holds all sprite parts
        let spriteCont = new PIXI.Container();

        //Calculate where to place each chunk sprite
        //midsections
        let points = [];
        let x = this.mids_tail_distance;
        for(let i=0; i<n_chunks; i++) {
            points.push([x, this.chunk_y]);
            x += this.chunk_distance;
        }
        //postion tail and head separate from midsections
        let point_tail = [0,0];
        let point_head = [x+this.head_mids_distance, 0];
        let point_eye = [point_head[0]+this.eye_head_offset[0], point_head[1]+this.eye_head_offset[1]]
        
        //Pick two colors to sample a gradient between
        let c1 = Math.round(Math.random() * 0xFFFFFF);
        let c2 = Math.round(Math.random() * 0xFFFFFF);
        //Choose an eye color independent of gradient
        let eyecolor = Math.round(Math.random() * 0xFFFFFF);

        //Pick samples from the gradient
        //sorting the colors here makes the gradient go in order
        let gc = [Math.random(), Math.random()]
        for(let i=0;i<n_chunks;i++) { gc.push(Math.random()); }
        gc.sort();
        if(Math.random() > 0.5) gc.reverse(); 
        
        //Array position of the chunk currently being manipulated
        let curr_chunk = 0;
        //variable holds color to tint stuff
        let tint = 0;
        
        //add the tail
        tint = this.Sample2ColorGradient(c1, c2, gc[0]);
        spriteCont.addChild(PIXI.Sprite.from(ntail));
        spriteCont.children[curr_chunk].anchor.set(0.5);
        spriteCont.children[curr_chunk].tint = tint;
        spriteCont.children[curr_chunk].position.x = point_tail[0];
        spriteCont.children[curr_chunk].position.y = point_tail[1];
        curr_chunk++;
        
        //add midsections
        let mids_start = curr_chunk;
        for(;(curr_chunk-mids_start)<n_chunks; curr_chunk++) {

            spriteCont.addChild(new PIXI.Sprite(mids));
            spriteCont.children[curr_chunk].anchor.set(0.5);
            tint = this.Sample2ColorGradient(c1, c2, gc[curr_chunk]); //choose color
            spriteCont.children[curr_chunk].tint = tint;     //apply color
            spriteCont.children[curr_chunk].position.x = points[curr_chunk-mids_start][0];
            spriteCont.children[curr_chunk].position.y = points[curr_chunk-mids_start][1];
        }

        //add the head
        tint = this.Sample2ColorGradient(c1, c2, gc[curr_chunk]);
        spriteCont.addChild(PIXI.Sprite.from(nhead));
        spriteCont.children[curr_chunk].anchor.set(0.5);
        spriteCont.children[curr_chunk].tint = tint;
        spriteCont.children[curr_chunk].position.x = point_head[0];
        spriteCont.children[curr_chunk].position.y = point_head[1];
        curr_chunk++;
        
      
        //add the eyes
        tint = eyecolor
        spriteCont.addChild(PIXI.Sprite.from(neyes));
        spriteCont.children[curr_chunk].anchor.set(0.5);
        spriteCont.children[curr_chunk].tint = tint;
        spriteCont.children[curr_chunk].position.x = point_eye[0];
        spriteCont.children[curr_chunk].position.y = point_eye[1];
        spriteCont.children[curr_chunk].tint = tint;       
        curr_chunk++;

        const image = app.renderer.extract.image(spriteCont, "image/png");  
        //view the image in console (testing only)
        image.then(res => {
            nematode.SetTexture(res);
        })
        
    }

    //Generate the rope given a sprite
    //wip
    static GenerateNematodeRope(nematode) {
        return; 
    }

    //Get a color between 2 other colors
    static Sample2ColorGradient(color1, color2, ratio) {
        let rgb1 = [
            (color1 >> 16) & 0xFF, //red
            (color1 >> 8) & 0xFF, //green
            color1 & 0xFF //blue
        ]
        let rgb2 = [
            (color2 >> 16) & 0xFF, //red
            (color2 >> 8) & 0xFF, //green
            color2 & 0xFF //blue
        ]
        let r3 = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * ratio);
        let g3 = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * ratio);
        let b3 = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * ratio);

        return ( (r3 << 16) + (g3 << 8) + b3);

    }

}