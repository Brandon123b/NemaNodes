
//Static class contains tools to generate and manipulate nematode bodies 
class SpriteGenerator {

    //variables used for testing
    //In the future these will vary for each nematode
    //and will be derived from other properties of the nt
    static n_chunks = 7;
    static chunk_distance = 20;
    static chunk_y = 0;
    static bodyPartWidth = 32;
    static bodyPartHeight = 32;

    static heads = [];
    static tails = [];
    static mids = [];
    static eyes = [];

    //load all sprite parts into arrays
    static LoadspriteChunks() {

        

        this.eyes.push(PIXI.Sprite.from('art/eyes01.png'));
        this.tails.push(PIXI.Sprite.from('art/tails01.png'));
        this.heads.push(PIXI.Sprite.from('art/head01.png'));
        this.mids.push(PIXI.Sprite.from('art/mids01.png'));


    }

    //Generate a texture that can then be either used as a sprite or attached to a rope
    //input: nematode to generate sprite for (currently doesn't matter)
    //output: a PIXI texture object
    static GenerateNematodeTexture(nematode) {
        
        //Calculate where to place each chunk sprite
        let points = [];
        let spriteCont = new PIXI.Container();

        let x = 0;
        for(let i=0; i<this.n_chunks; i++) {
            points.push([x, this.chunk_y]);
            x += this.chunk_distance;
        }

        
        let c1 = Math.round(Math.random() * 0xFFFFFF);
        let c2 = Math.round(Math.random() * 0xFFFFFF);
        let eyecolor = Math.round(Math.random() * 0xFFFFFF);
        
        //random tints
        /*
        //tint
        this.heads[0].tint = Math.round(Math.random() * 0xFFFFFF);
        //tint
        this.eyes[0].tint = Math.round(Math.random() * 0xFFFFFF);
        //tint
        this.tails[0].tint = Math.round(Math.random() * 0xFFFFFF);
        //tint
        this.mids[0].tint = Math.round(Math.random() * 0xFFFFFF);
        */

       //2 color gradient with gradient multiplier
       //(channel naive multiplier breaks gradient lol)
       let gm = 1
       //sorting the colors here makes the gradient go in order; undecided on if I want that
       let gc = [gm*Math.random(), gm*Math.random(), gm*Math.random()] //.sort(); 
       this.heads[0].tint = this.Sample2ColorGradient(c1, c2, gc[0]);
       this.mids[0].tint = this.Sample2ColorGradient(c1, c2, gc[1]);
       this.tails[0].tint = this.Sample2ColorGradient(c1, c2, gc[2]);
       this.eyes[0].tint = eyecolor;
        
       //add some midsections 
       spriteCont.addChild(this.mids[0]);
       //add head to container
        spriteCont.addChild(this.heads[0]);
        //add eyes
        spriteCont.addChild(this.eyes[0]);
        //add a tail
        spriteCont.addChild(this.tails[0]); 
        //convert to a texture
        const image = app.renderer.extract.image(spriteCont, "image/png");  
        //view the image in console (testing only)
        
        image.then(res => {
            console.log(res)
            document.body.appendChild(res)
        }, console.log)
        
        
        //image.defaultAnchor = 0.5;
        //sprite = new PIXI.Sprite(image);
        //sprite.anchor.set(0.5);
        //return sprite;
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