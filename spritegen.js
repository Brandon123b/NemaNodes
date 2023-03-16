/*
    Create a single SpriteGenerator for the world and use it to generate sprites. 
    WIP
*/


class SpriteGenerator {

    //Amplitude constraints
    static maxAmplitude = 5;
    static minAmplitude = 0.5;
    //Wavelength constraints
    static maxFrequency = 2;
    static minFrequency = 0.5;
    //Constraint on number of body parts
    static minBodyParts = 4;
    static maxBodyParts = 20

    //Spacing between body parts
    //Might make this a range too idk
    static bodyPartSpacing = 20;

    //internal
    //return a random decimal between min and max
    static rand_dec(min, max) {

        return Math.random() * (max-min) + min;
    }


    //Generate a new sprite with no parent info
    static async NewSpriteRandom() {
        
        await PIXI.Assets.load('Bibite.png');

        //create random parameters
        var amplitude = this.rand_dec(this.minAmplitude, this.maxAmplitude);
        var frequency = this.rand_dec(this.minFrequency, this.maxFrequency);
        var n_parts = Math.floor(this.rand_dec(this.minBodyParts, this.maxBodyParts));
        var x_head = 0; //x point to start generating at; might need to tweak

        //generate body part postions
        var sample_x = Array(n_parts);
        var sample_y = Array(sample_x.length);
        var xpos = x_head; 
        for(var i=0;i<sample_y.length;i++) {
            sample_x[i] = xpos;
            sample_y[i] = amplitude * Math.cos( frequency * sample_x );
            xpos += this.bodyPartSpacing;
        }

        var spriteCont = new PIXI.Container;

        for(var i=0; i<sample_x.length;i++) {
            var chunk = PIXI.Sprite.from('Bibite.png');
            //place body part
            //TODO: make sprite body parts
            //TODO: different body parts for head and tail
            //TODO: will probably need to scale the sprites
            chunk.x = sample_x[i];
            chunk.y = sample_y[i];
            //TODO: rotate it to point towards the part in front of it
            
            //set anchor and add to container
            chunk.anchor.set(0.5);
            spriteCont.addChild(chunk);
        }

        const image = app.renderer.extract.image(spriteCont, "image/png", height=256, width=256);
        
        //view the image in console (testing only)
        image.then(res => {
            console.log(res)
            document.body.appendChild(res)
            }, console.log)
        

        //return PIXI.Sprite.from(image);
        return 0;

    }

     
    //Generate child sprite from parent
    //TODO
    //Plan: Take params from parent, add a random offset for each
    //then do NewSpriteRandom() with that
    static NewSpriteFromParent(parent) {
        return 0
    }

    

}