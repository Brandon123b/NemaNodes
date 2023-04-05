
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

        //tint
        this.heads[0].tint = Math.round(Math.random() * 0xFFFFFF);
        //tint
        this.eyes[0].tint = Math.round(Math.random() * 0xFFFFFF);
        //tint
        this.tails[0].tint = Math.round(Math.random() * 0xFFFFFF);
        //tint
        this.mids[0].tint = Math.round(Math.random() * 0xFFFFFF);


        //add head to container
        spriteCont.addChild(this.heads[0]);
        //add eyes
        spriteCont.addChild(this.eyes[0]);
        //add some midsections 
        spriteCont.addChild(this.mids[0]);
        //add a tail
        spriteCont.addChild(this.tails[0]);

        //convert to a texture
        const image = app.renderer.extract.image(spriteCont, "image/png");

        //view the image in console (testing only)
        /*
        image.then(res => {
            console.log(res)
            document.body.appendChild(res)
        }, console.log)
        */
        image.defaultAnchor = 0.5;
        sprite = new PIXI.Sprite(image);
        return sprite;
    }

    //Generate the rope given a sprite
    //wip
    static GenerateNematodeRope(nematode) {
        return; 
    }

}